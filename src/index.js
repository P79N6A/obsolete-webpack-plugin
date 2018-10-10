const { resolve } = require('path');
const browserslist = require('browserslist');
const { readFileAsync } = require('./lib/async-fs');
const WebAsset = require('./web-asset');

const libraryPath = resolve(__dirname, '../web-dist/obsolete.js');

class ObsoleteWebpackPlugin {
  /**
   * @param {Object} [options] Configuration.
   * @param {string} [options.name] The chunk name
   * @param {boolean} [options.async] The script attribute.
   * @param {string} [options.template] The prompt html template. If not set, then templatePath will be read.
   * @param {string} [options.templatePath] The prompt template path, shound be a Vue or React component.
   * @param {string[]} [options.browsers] The browsers to support, overriding browserslist.
   * @param {boolean} [options.promptOnNonTargetBrowser] If the current browser name doesn't match one of the
   * target browsers, it's considered as unsupported. Thus, the prompt will be shown.
   */
  constructor(options) {
    const defaultOptions = {
      name: 'obsolete',
      async: true,
      template: '',
      templatePath: '',
      promptOnNonTargetBrowser: false,
    };

    this.options = {
      ...defaultOptions,
      ...options,
    };
  }
  /**
   * Entrypoint of plugin.
   *
   * @param {Compilation} compiler See also webpack/lib/Compilation.js.
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(this.constructor.name, compilation => {
      compilation.hooks.additionalAssets.tapPromise(this.constructor.name, () =>
        this.additionalAssets(compilation)
      );
    });
  }
  /**
   * Attach plugin chunk to webpack inside.
   * Generate additional asset finally.
   *
   * @param {Compilation} compilation See also webpack/lib/Compilation.js.
   */
  async additionalAssets(compilation) {
    if (compilation.name) {
      return;
    }

    const webAsset = new WebAsset(
      libraryPath,
      compilation.outputOptions.filename
    );
    const obsoleteChunk = compilation.addChunk(this.options.name);
    const template = await this.createTemplate();

    await webAsset.populate({
      browsers: browserslist(this.options.browsers),
      template,
      promptOnNonTargetBrowser: this.options.promptOnNonTargetBrowser,
    });
    webAsset.hash(this.options.name);
    this.connectEntrypointAndChunk(compilation, obsoleteChunk);
    obsoleteChunk.ids = [this.options.name];
    obsoleteChunk.files.push(webAsset.filename);
    compilation.assets[webAsset.filename] = webAsset.getWebpackAsset();
  }
  /**
   * Connect entrypoint chunk group with plugin chunk each other
   *
   * @param {Compilation} compilation See also webpack/lib/Compilation.js.
   * @param {Chunk} chunk See also webpack/lib/Chunk.js.
   */
  connectEntrypointAndChunk(compilation, chunk) {
    for (const entrypoint of compilation.entrypoints.values()) {
      if (entrypoint.pushChunk(chunk)) {
        chunk.addGroup(entrypoint);
      }
    }
  }
  /**
   * Create html template from options `template` or `templatePath`.
   */
  async createTemplate() {
    if (!this.options.template && this.options.templatePath) {
      const template = readFileAsync(this.options.templatePath, 'utf-8');

      return template;
    }
    return this.options.template;
  }
}

module.exports = ObsoleteWebpackPlugin;
