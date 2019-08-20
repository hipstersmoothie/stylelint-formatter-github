import stylelint from 'stylelint';
import pretty from 'stylelint-formatter-pretty';

import createCheck from './create-check';

const formatter: stylelint.FormatterType = results => {
  createCheck(results);
  return pretty(results);
};

export = formatter;
