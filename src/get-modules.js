var fs = require('fs');
var path = require('path');
// var sourceDir = path.join(__dirname, '../src');

var escapeRegExp = function (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

var findAllFilesRecursively = function (dir) {
    var allFiles = [];
    var filesInDir = fs.readdirSync(dir);

    filesInDir.forEach(function (fileName) {
        var filePath = path.join(dir, fileName);
        var fstats = fs.statSync(filePath);

        if (fstats.isDirectory()) {
            allFiles = allFiles.concat(findAllFilesRecursively(filePath));
        } else {
            allFiles.push(filePath);
        }
    });

    return allFiles;
};

var getProvidedModule = function (str, regex) {
    var match = regex.exec(str);
    return match && match[1];
};

var getProvidedModulesFromFiles = function (filePaths, regex) {
    var modules = {};

    filePaths.forEach(function (filePath) {
        var fileContents = fs.readFileSync(filePath, 'utf8');
        var module = getProvidedModule(fileContents, regex);
        if (module) {
            modules[module] = filePath;
        }
    });

    return modules;
};

module.exports = function (sourceDir, aliasToken) {
    var regex = new RegExp(escapeRegExp(aliasToken) + '\\s+([^\\s]+)');

    var files = findAllFilesRecursively(sourceDir);
    var aliases = getProvidedModulesFromFiles(files, regex);

    return {
        files: files,
        aliases: aliases,
    };
};