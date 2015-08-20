'use strict';

module.exports = function(grunt) {

  var fs = require('fs'),
      swig = require('swig'),
      path = require('path');

  grunt.registerMultiTask('swig', 'swig templater', function(tpl_context) {
    var config = this,
        context = tpl_context || '',
        pages = [],
        date = new Date(),
        d = date.toISOString(),
        defaultPriority = (config.data.sitemap_priorities !== undefined)? config.data.sitemap_priorities._DEFAULT_ : '0.5',
        generateSitemap = config.data.generateSitemap != undefined ? config.data.generateSitemap : true,
        generateRobotstxt = config.data.generateRobotstxt != undefined ? config.data.generateSitemap : true,
        // Added this config option to define where to look for the global template variables
        defaultGlobalVarSrc = config.data.defaultGlobalVarSrc != undefined ? config.data.defaultGlobalVarSrc : '/global.json',
        globalVars = {};

    if (config.data.init !== undefined) {
      swig.setDefaults(config.data.init);
    }

    // Global file that can be used for all templates
    try {
      globalVars = grunt.util._.extend(config.data, grunt.file.readJSON(process.cwd() + defaultGlobalVarSrc));
    } catch (err) {
      globalVars = grunt.util._.clone(config.data);
    }

    this.filesSrc.forEach(function(file) {
      if (!grunt.file.exists(file)) {
        grunt.log.warn('Source file "' + file.src + '" not found.');

        return false;
      } else {
        var dirName = path.dirname(file).split('/'),
            destPath = dirName.splice(1, dirName.length).join('/'),
            outputFile = path.basename(file, '.swig'),
            htmlFile = config.data.dest + '/' + destPath + '/' + outputFile + '.html',
            tplVars = {},
            contextVars = {};

        // Looks for a .json file with the same name as the swig file it is processing
        try {
          tplVars = grunt.file.readJSON(path.dirname(file) + '/' + outputFile + ".json");
        } catch(err) {
          tplVars = {};
        }

        try {
          contextVars = grunt.file.readJSON(path.dirname(file) + '/' + outputFile + "." + context + ".json");
        } catch(err) {
          contextVars = {};
        }

        tplVars.context = context;
        tplVars.tplFile = {
          path: destPath,
          basename: outputFile
        };

        grunt.log.writeln('Writing HTML to ' + htmlFile);

        grunt.file.write(htmlFile, swig.renderFile(file, grunt.util._.extend(globalVars, tplVars, contextVars)));

        if (config.data.sitemap_priorities !== undefined && config.data.sitemap_priorities[destPath + '/' + outputFile + '.html'] !== undefined) {
          pages.push({
            url: config.data.siteUrl + htmlFile.replace(config.data.dest + '/', ''),
            date: d,
            changefreq: 'weekly',
            priority: config.data.sitemap_priorities[destPath + '/' + outputFile + '.html']
          });
        } else {
          pages.push({
            url: config.data.siteUrl + htmlFile.replace(config.data.dest + '/', ''),
            date: d,
            changefreq: 'weekly',
            priority: defaultPriority
          });
        }
      }
    });

    if (generateSitemap) {
      grunt.log.writeln('Creating sitemap.xml');
      grunt.file.write(config.data.dest + '/sitemap.xml', swig.renderFile(__dirname + '/../templates/sitemap.xml.swig', { pages: pages}));
    }

    if (generateRobotstxt) {
      grunt.log.writeln('Creating robots.txt');
      grunt.file.write(config.data.dest + '/robots.txt', swig.renderFile(__dirname + '/../templates/robots.txt.swig', { robots_directive: config.data.robots_directive || '' }));
    }
  });
};
