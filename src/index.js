'use strict';

var getModules = require('./get-modules');
var fix = require('./fix');

var DEFAULT_ALIAS_TOKEN = '@alias';

var getAliases = function (srcPath, aliasToken) {
  return getModules(srcPath, aliasToken || DEFAULT_ALIAS_TOKEN).aliases;
};

var replace = function (srcPath, aliasToken) {
  var foundModules = getModules(srcPath, aliasToken || DEFAULT_ALIAS_TOKEN);
  var fixResults = fix(foundModules.aliases, foundModules.files);

  return {
    aliases: foundModules.aliases,
    files: foundModules.files,
    changes: [
      {
        name: 'asdf',
      }
    ],
  };
};

module.exports = {
  getAliases: getAliases,
  replace: replace,
};
