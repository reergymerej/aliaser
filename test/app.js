'use strict';

var will = require('willy').will;
var app = require('../');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var testSource = path.join(__dirname, 'test-source');
var aliasCount = 0;

var getAliasContent = function (token) {
  token = token || '@alias';
  return token + ' coolAlias#' + (aliasCount++) + '\n';
};

var getRequireForAlias = function (alias) {
  return 'var aliasedRequire = require(\'' + alias + '\')\n';
};

var createDummySource = function (root) {
  aliasCount = 0;

  mkdirp.sync(path.join(root, 'a/aa'));
  mkdirp.sync(path.join(root, 'b'));
  mkdirp.sync(path.join(root, 'ignore'));

  fs.writeFileSync(path.join(root, 'root.module'), getAliasContent(), 'utf8');
  fs.writeFileSync(path.join(root, 'a/a.module'), getAliasContent(), 'utf8');
  fs.writeFileSync(path.join(root, 'a/aa/aa.module'), getAliasContent(), 'utf8');
  fs.writeFileSync(path.join(root, 'b/b.module'), getAliasContent(), 'utf8');

  fs.writeFileSync(path.join(root, 'root.source'), getRequireForAlias('coolAlias#3'), 'utf8');
  fs.writeFileSync(path.join(root, 'a/a.source'), getRequireForAlias('coolAlias#1'), 'utf8');
  fs.writeFileSync(path.join(root, 'a/aa/aa.source'), getRequireForAlias('coolAlias#2'), 'utf8');
  fs.writeFileSync(path.join(root, 'b/b.source'), getRequireForAlias('coolAlias#0'), 'utf8');
};

describe('aliaser', function () {
  beforeEach(function () {
    rimraf.sync(testSource);
    createDummySource(testSource);
  });

  describe('finding aliases', function () {
    it('should return a hash of aliases it found', function () {
      var aliases = app.getAliases(path.join(testSource, 'a'));
      will(aliases).beAn(Object);
      will(Object.keys(aliases)).have

      will(aliases).haveOnly([
        'coolAlias#0',
        'coolAlias#1',
        'coolAlias#2',
        'coolAlias#3',
      ]);
    });

    it('should only search the specified directory', function () {
      var aliases = app.getAliases(path.join(testSource, 'b'));

      will(aliases).haveOnly([
        'coolAlias#3',
      ]);
    });

    describe('each alias', function () {
      it('should reference the absolute file', function () {
        var aliases = app.getAliases(path.join(testSource, 'b'));
        will(aliases['coolAlias#3']).be(path.join(testSource, 'b/b.module'))
      });
    });
  });

  describe('replacing referenced aliases in source', function () {
    describe('the results of replace', function () {
      var results;

      before(function () {
        results = app.replace(path.join(testSource));
      });

      it('should return a hash of the aliases found', function () {
        will(results.aliases).have([
          'coolAlias#0',
          'coolAlias#1',
          'coolAlias#2',
          'coolAlias#3',
        ]);
      });

      it('should return a list of the source searched', function () {
        will(results.files.length).be(8);
      });

      describe('the list files changed', function () {
        it('should have the name of the file', function () {
          will(results.changes[0]).have('name');
        })
      });

      it('should replace the alias ref in the source with a relative path', function () {
        var fixedUpFile = fs.readFileSync(path.join(testSource, 'a/aa/aa.source'), 'utf8');

        // it starts as this
        // var aliasedRequire = require('coolAlias#2')
        var aliasIndex = fixedUpFile.indexOf('coolAlias');
        will(aliasIndex).be(-1);

        // and should end up like this
        // var aliasedRequire = require('./aa')
        var convertedIndex = fixedUpFile.indexOf('./aa');
        will(convertedIndex).beMoreThan(-1);
      });
    });

    it('should work for "require" and "import"');
  });

  describe('configuration options', function () {
    it('should allow for a specified "alias" token');
    it('should search source in a specified directory');
  });
});
