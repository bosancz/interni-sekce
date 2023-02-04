const conventional = require("@commitlint/config-conventional");
const types = [...conventional.rules["type-enum"][2], "wip"];

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", types],
  },
};
