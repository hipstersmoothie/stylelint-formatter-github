<div align="center">
  <img  height="200"
    src="./logo.png">
  <h1>stylelint-formatter-github</h1>
  <p>See stylelint errors and warnings directly in pull requests</p>
</div>

## Highlights

- Report your stylelint results as annotations using the [GitHub Checks API](https://developer.github.com/v3/checks/)
- Only runs in CI environment
- Uses [stylelint-formatter-pretty](https://github.com/Dreamseer/stylelint-formatter-pretty) as the formatter for displaying the lint results

![Example of annotations being included in a pull request](./example.png)

## Install

```sh
npm install --save-dev stylelint-formatter-github
# or
yarn add -D stylelint-formatter-github
```

## Usage

You will need to install [the GitHub app](https://github.com/apps/stylelint-results) to your repo.

Then just use the formatter, and it will report errors and warnings on PRs!

```sh
stylelint --custom-formatter=node_modules/stylelint-formatter-github file.js
```

## Using your own GitHub App

You might not want to use our GitHub app for the formatter.

Reasons:

1. You think the way we exposed the keys is bad
2. You are on GitHub Enterprise and cannot use the public app

In these situations, all you need to do is create a GitHub app and set a few environment variables.

### 1. Create a GitHub app

Go to [this page](https://github.com/settings/apps) to create a new GitHub app. You need to set the following fields:

- `name` - The name that shows for your app in the checks reports
- `Homepage URL` - You can set this to anything. Ours is set to `https://github.com`
- `Webhook URL` - You can set this to anything. Ours is set to `https://github.com`

Then hit `Save Changes` and you're all done setting up your GitHub app.

### 2. Set `STYLELINT_APP_ID` environment variable

Your GitHub application's ID. This can be found at the top of your GitHub app's edit page.

### 3. Set `STYLELINT_PRIVATE_KEY` environment variable

The private RSA key for your application. The prompt to generate the RSA key is at the bottom of your GitHub app's edit page.

Once you have generated a key, open the file that is downloaded and copy the text into the `PRIVATE_KEY` environment variable.

### 4. Set `GH_API` (enterprise only)

To get this package to work on GitHub enterprise instances, you will need to set the `GH_API` environment variable to a URL pointing towards your enterprise GitHub's API.
