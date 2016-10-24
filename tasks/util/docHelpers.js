import config from '../../config';
import { sync as glob } from 'glob';
import { relative, sep } from 'path';
import yaml from 'js-yaml';
import { nunjucks } from 'gulp-nunjucks-render';
import marked from 'marked';
import { html as htmlBeautify } from 'js-beautify';

/**
 * Doc task helper functions
 */
class docsHelpers {

    /**
     * Render component
     * @param {Buffer} content - File content
     * @param {File} file - File object
     * @returns {string} component - rendered component
     */
    static renderComponent(content, file) {
        const yml = yaml.load(content);
        const locals = Object.assign(yml.data || '{}', { baseUri: config.html.baseUri });
        let sample = htmlBeautify(nunjucks.render(file.path.replace('.yml', '.html'), locals));

        const data = {
            title: yml.title,
            description: marked(yml.description || ''),
            implementation: marked(yml.implementation || '').replace('<table', '<table class="table"'),
            demo: file.path.split(sep).pop().replace('.yml', '.demo.html'),
            sample: sample
        };

        return nunjucks.render(config.docs.src.component, data);

    }

    /**
     * Render component demo
     * @param {Buffer} content - File content
     * @param {File} file - File object
     * @returns {string} component - rendered component
     */
    static renderComponentDemo(content, file) {
        const yml = yaml.load(content);
        const locals = Object.assign(yml.data || '{}', { baseUri: config.html.baseUri });
        let demo = nunjucks.render(file.path.replace('.yml', '.html'), locals);
        demo = (yml.demo || '{}').replace('{}', demo);

        return nunjucks.render(config.docs.src.preview, { baseUri: config.html.baseUri, demo: demo, moduleLoader: config.moduleLoader });

    }

    /**
     * Get relative paths
     * @param {string} globString - glob pattern for the files
     * @param {string} relativeTo - dir name
     * @returns {Array} paths - array of relative paths
     */
    static getRelativePaths(globString, relativeTo) {
        return glob(globString, { nosort: true }).map(dir => relative(relativeTo, dir));
    }

    /**
     * Get the component tree
     * @param {string} globString - glob pattern for the component files
     * @param {string} relativeTo - dir containing the files in globString
     * @returns {Object} tree - object with alle components and children
     */
    static getComponentTree(globString, relativeTo) {

        const files = docsHelpers.getRelativePaths(globString, relativeTo);

        return files.reduce((tree, file) => {
            const path = file.split(sep).reverse()[1];
            const name = file.split(sep).reverse()[0].replace('.yml', '');

            tree[path] = tree[path] || {};
            tree[path].variations = tree[path].variations || [];
            tree[path].variations.push({ url: file.replace('.yml', '.html'), name: name });

            return tree;

        }, {});
    }

}

export default docsHelpers;