import path from 'path';
import stylelint from 'stylelint';
import createCheck from 'create-check';
import pretty from 'stylelint-formatter-pretty';

import Octokit from '@octokit/rest';

const APP_ID = process.env.STYLELINT_APP_ID
  ? Number(process.env.STYLELINT_APP_ID)
  : 38894;
/**
 * Before you say anything I *know* this is horribly insecure.
 *
 * If we were not to to this then every user would have to create
 * their own GitHub App and manage the APP_ID and PRIVATE_KEY through
 * env vars.
 *
 * How could this go wrong? Well this PRIVATE_KEY only creates jwt
 * tokens that work on people who have installed the ESLint Results
 * App. If an attacker got ahold of the token they could only read repo
 * metadata and read/write checks. So the attack surface is really only
 * messing with a users checks, which is not too risky.
 */
const PRIVATE_KEY =
  process.env.STYLELINT_PRIVATE_KEY ||
  `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA2d7s/bFVyjeR3aueP1voZaSDG3KoR9e/4qobOdhId9aFPS78
3hbzcT2tnxL55nbtxSLpF6AuoKeEkGfWGSF5+hBqXlIwU+Qn5EDFA/KCFIksDvf4
YPLsnsidXqbM1tBvo7VLcIw7TIN724I7DDjdWbLMcl5W+DsONqD5FUat+nI5ACbD
6tgLDCfBIh241AAwUg1mZV98I01mD7eFEGaVsG9zVaxo/mHJzWoFNrwjQCaUaJjF
9ImRlH1n4VdEo7WKnlR6nXjmMzloUliLdS7Ve3USxVz/FRzZ1ErYz7UB7Pq8Qi0p
wJYUh25o9IbWLupUqlnNU/gtMH8PjgD3OM4P2wIDAQABAoIBAAJQU8P99iNHo8zu
3ademoE51gqclRzuNaN6mv9qRJrBNHkJ3rWdGMjDFuzxjqXb7XqCfGc71ELwhH/k
Gmn56Qm20updhRXe/m12IqGAGdGOA2HFUGX3LnwhNUqkCtjdLdJXQo3Xb2nIm7Ah
Ge9vSyqAs5sjVVkdh3EdFIgdUAuw1dTeyw0PwwbZluvTOIpaSwsfCUCmc6D+/r2n
tlniyyS3D1H4NDqMUZeZlFFL5BxZF5n8CQmkgu3ftKgJsghOMsbvCC5PTH2McPLQ
uSm6eFAceKabGdS22QZ3q+sBFb6QMFUcZtu1bpDJ/T2XlEDC4ZXk9way2YsiH0G8
MwjUA4ECgYEA9iyBEhBHymGuq2CMNJMskbCGZx5n17BcI4mMNn1SNbHYiUqkqhHr
7nfSQML2RFCz3J+FwKlrS/vvz1mqqzD6saNNUTfyWk0gToBuxG2hYS9nq2rkFH7p
bMxZIpfG6fSz2IslJDLfB1ohsWeVXkGntHqaBWmRNN0HKYyKB/xZWUMCgYEA4pE1
6FgOv7SLj1nKwvBWDHSf3wZXLAIpQ8GWtPmlpsvBkWN7Ksjy3NXlxlZFWm8BcvnC
dfavt3oonoJlN5vXI5lCVoMkab+ApGRsuluMtBVTvn9YY0xjVnpyTj7q4DDx9l0D
noZAg4hQYl8IVH3DO9ry78N1l/bm1d/TV1FnWYkCgYAJUMXRmSweTHP/qDemBau6
F6P+YvgrAVF7Rsk3hqaFwaUgDOMOTH9RFtet+7K2AxfLUX4OPFsDFRWOEyaSM9hI
wJU8bZGOOTzvu4x1gnCI7PJPWkwnOmY658C3vmaYk9n6Z8mQBRzLem2r+O9+EZ33
Bmytp8EG7xZGTDss8i+vYQKBgEKB6dcocjvoHceYziJnNns1iPCJBfHPOJnBLCI3
3l6WFV4+W5t1nYUh7O9Jx9YCG+TKWEEUhwRPAbl2AYxPXNoAVS7cFEZOhs67BAe4
dBcw44JaE3IirE5oZ0F8yqnA9GYja7qPIkT6MM6PovxaZoMdhI7JS62uNpi1uW46
YSIxAoGASxMp8/NOTRmOIzeX5tZzxeXsJt7tNLll/cqo3iHmPZWm39XINzjM3SEV
j38c+yyejze8RnBpD3ADdlXjhsIFhkE0XKaXGPlA0omNWKRqh4QAvJYigBJZthXW
vEmNUgO5zSXutnnYyVCuiuBdYbWAdbqHFwOLtywHZOSUimIdccM=
-----END RSA PRIVATE KEY-----`;

function createAnnotations(results: stylelint.LintResult[]) {
  const annotations: Octokit.ChecksCreateParamsOutputAnnotations[] = [];
  const levels: Record<
    stylelint.Severity,
    Octokit.ChecksCreateParamsOutputAnnotations['annotation_level']
  > = {
    warning: 'warning',
    error: 'failure'
  };

  for (const result of results) {
    const { source, warnings } = result;

    for (const warning of warnings) {
      const { line, severity, rule, text } = warning;
      const annotationLevel = levels[severity];

      annotations.push({
        path: path.relative(process.cwd(), source),
        start_line: line,
        end_line: line,
        annotation_level: annotationLevel,
        message: `[${rule}] ${text}`
      });
    }
  }

  return annotations;
}

const formatter: stylelint.FormatterType = results => {
  let errorCount = 0;
  let warningCount = 0;

  results.forEach(result => {
    const { warnings } = result;

    if (warnings.length === 0) {
      return;
    }

    errorCount += warnings.filter(warning => warning.severity === 'error')
      .length;
    warningCount += warnings.filter(warning => warning.severity === 'warning')
      .length;
  });

  createCheck({
    tool: 'stylelint',
    name: 'Check Styles for Errors',
    annotations: createAnnotations(results),
    errorCount,
    warningCount,
    appId: APP_ID,
    privateKey: PRIVATE_KEY
  });

  return pretty(results);
};

export = formatter;
