var fs = require('fs');
var path = require('path');

var escapeRegExp = function (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

var getRelativePath = function (fromFile, toFile) {
    var relativePath = path.relative(
        path.dirname(fromFile),
        path.dirname(toFile)
    );

    if (!relativePath) {
        relativePath = '.';
    } else if (relativePath[0] !== '.') {
        relativePath = '.' + path.sep + relativePath;
    }

    relativePath += path.sep;

    return relativePath + path.basename(toFile);
};

var buildReplacements = function (modules, destinationFile) {
    var expressions = Object.keys(modules).map(function (alias) {
        var modulePath = modules[alias];
        var relative = getRelativePath(destinationFile, modulePath);

        return {
            alias: alias,
            regex: new RegExp('(from +\')' + escapeRegExp(alias)),
            value: modulePath,
            relative: relative.replace(/\.js$/, ''),
            destinationFile: destinationFile,
        };
    });

    return expressions;
}

var makeReplacementsInFile = function (replacements, filePath) {
    var contents = fs.readFileSync(filePath, 'utf8');
    var replacementsMade = [];

    replacements.forEach(function (replacement) {
        if (replacement.regex.test(contents)) {
            contents = contents.replace(replacement.regex, function (matched, p1) {
                return p1 + replacement.relative;
            });
            replacementsMade.push({
                new: replacement.relative,
                old: replacement.alias,
            });
        }
    });

    if (replacementsMade.length) {
        fs.writeFileSync(filePath, contents, 'utf8');
        console.log('replaced %d import(s) in %s', replacementsMade.length, filePath);
        console.log(
            replacementsMade.map(function (replacement) {
                return '\t' + replacement.old + ' > ' + replacement.new;
            }).join('\n'), '\n'
        );
    }
};

var iterateProvidedModules = function (providedModules, fn) {
    Object.keys(providedModules).forEach(function (moduleAlias) {
        var modulePath = providedModules[moduleAlias];
        fn(moduleAlias, modulePath);
    });
};

var rewriteRefsInSource = function (providedModules, files) {
    console.log('... rewriting imports to use relative paths instead of module alias');
    files.forEach(function (filePath) {
        var replacements = buildReplacements(providedModules, filePath);
        makeReplacementsInFile(replacements, filePath);
    });
};

var complain = function (providedModules) {
    iterateProvidedModules(providedModules, function (moduleAlias, modulePath) {
        console.log('found @providedModule ref in %s', modulePath);
    });
};

module.exports = rewriteRefsInSource;
// module.exports = complain;
// module.exports = replaceWithRelativePath;
