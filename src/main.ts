import { App, Plugin } from 'obsidian';
import { CustomIconSettings, SidebarIcons, FolderIcons, FileIcons, InternalLinkIcons, DEFAULT_SETTINGS} from './types';
import { EMPTY_PNG_DATA_URL } from './types';
import { generateUniqueId, updatePreview, convertToCamelCase } from './utils/utils';
import * as lucideIcons from 'lucide-static';

import { CustomIconSettingTab } from 'src/settings/settingstab';

const css_filename = "CustomIcon-AutoGen";

export default class CustomIconPlugin extends Plugin {
    settings: CustomIconSettings;
    resourceBase: string;
    themeObserver: MutationObserver | null = null;
    
    async onload() {
        await this.loadSettings();
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshSidebarIcons();
            })
        );
        this.addSettingTab(new CustomIconSettingTab(this.app, this));
        await this.genSnippetCSS(this);
        this.observeThemeChange();
    }

    onunload() {
        // @ts-ignore
        const customCss = this.app.customCss;
        if (customCss.enabledSnippets instanceof Set) {
            customCss.enabledSnippets.delete(css_filename);
        }
        customCss.requestLoadSnippets();
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.migrateData();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    observeThemeChange() {
        this.themeObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {
                    const body = document.body;
                    if (body.classList.contains('theme-light') || body.classList.contains('theme-dark')) {
                        this.genSnippetCSS(this);
                    }
                }
            });
        });

        this.themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    migrateData() {
        if (this.settings.customIcons && this.settings.customIcons.length > 0) {
            this.settings.SidebarIcons = [...this.settings.SidebarIcons, ...this.settings.customIcons];
            delete (this.settings as { customIcons?: unknown }).customIcons;
            this.saveSettings();
        }
    
        this.settings.SidebarIcons.forEach(icon => {
            if (icon.id.startsWith('icon')) {
                icon.id = generateUniqueId("sidebar-icon");
                this.saveSettings();
            }
        });
    
        this.settings.FolderIcons.forEach(icon => {
            if (icon.id.startsWith('icon')) {
                icon.id = generateUniqueId("folder-icon");
                this.saveSettings();
            }
        });
    
        if (this.settings.FileIcons && this.settings.FileIcons.length > 0) {
            this.settings.FileIcons.forEach(icon => {
                if (typeof icon.path === 'string') {
                    icon.path = [icon.path]; 
                }
            });
            this.saveSettings();
        }
    }

    async genSnippetCSS(plugin: CustomIconPlugin) {
        const content: string[] = [
			"/* * WARNING: This file will be overwritten by plugin `Custom Icon`.",
			"   * DO NOT EDIT THIS FILE DIRECTLY!!!",
			"   * Do not edit this file directly!!!",
			"*/",
			"",
		];
        plugin.settings.SidebarIcons.forEach(iconSetting => {
            content.push(this.genSidebarIconsEntryCSS(iconSetting));
        });
        plugin.settings.FolderIcons.forEach(iconSetting => {
            content.push(this.genFolderIconsEntryCSS(iconSetting));
        });
        plugin.settings.FileIcons.forEach(iconSetting => {
            content.push(this.genFileIconsEntryCSS(iconSetting));
        });
        plugin.settings.InternalLinkIcons.forEach(iconSetting => {
            content.push(this.genInternalLinkIconsEntryCSS(iconSetting));
        });

        const vault = plugin.app.vault;
		const ob_config_path = vault.configDir;
		const snippets_path = ob_config_path + "/snippets";

		const path = `${snippets_path}/${css_filename}.css`;
		if (!(await vault.adapter.exists(snippets_path))) { await vault.adapter.mkdir(snippets_path); }
		if (await vault.adapter.exists(path)) { await vault.adapter.remove(path) }
		await plugin.app.vault.create(path, content.join('\n'));
		// @ts-ignore
		const customCss = this.app.customCss;
		customCss.enabledSnippets.add(css_filename);
		customCss.requestLoadSnippets();
    }

    genSidebarIconsEntryCSS(settings: SidebarIcons): string {
        const selector = `aria-label="${settings.label}"`;
        const iconUrl = this.getResourcePathwithType(settings.image, settings.type);
        let body: string[] = [
            `.custom-icon.workspace-tab-header[${selector}] .workspace-tab-header-inner-icon::before {`,
            `content: '';`,
            `display: inline-block;`,
            `width: 1em;`,
            `height: 1em;`,
            `background-color: transparent;`,
            `background-blend-mode: normal;`,
            `background-image: url("${iconUrl}");`,
            `background-size: contain;`,
            `background-repeat: no-repeat;`,
            `background-position: center;`,
            `}`,
        ];
        return body.join('\n');
    }
    genFolderIconsEntryCSS(settings: FolderIcons): string {
        const selector = `data-path="${settings.path}"`;
        const iconUrl = this.getResourcePathwithType(settings.image, settings.type);
        let body: string[] = [
            `.nav-folder-title[${selector}] .nav-folder-title-content::before {`,
            `content: '';`,
            `display: inline-block;`,
            `width: 16px;`,
            `height: 16px;`,
            `margin: 0px 2px -4px 0px;`,
            `background-color: transparent;`,
            `background-blend-mode: normal;`,
            `background-image: url("${iconUrl}");`,
            `background-size: contain;`,
            `background-repeat: no-repeat;`,
            `}`,
        ];
        return body.join('\n');
    }
    genFileIconsEntryCSS(settings: FileIcons): string {
        const iconUrl = this.getResourcePathwithType(settings.image, settings.type);
        let body: string[] = settings.path.map((path) => {
            const selector = `data-path$="${path}"`;
            return [
                `.nav-file-title[${selector}] .nav-file-title-content::before {`,
                `content: '';`,
                `display: inline-block;`,
                `width: 16px;`,
                `height: 16px;`,
                `margin: 0px 2px -4px 0px;`,
                `background-color: transparent;`,
                `background-blend-mode: normal;`,
                `background-image: url("${iconUrl}");`,
                `background-size: contain;`,
                `background-repeat: no-repeat;`,
                `}`
            ].join('\n');
        });
        return body.join('\n\n');
    }
    genInternalLinkIconsEntryCSS(settings: InternalLinkIcons): string {
        const iconUrl = this.getResourcePathwithType(settings.image, settings.type);
        let body: string[] = settings.path.map((path) => {
            const selector = `data-href$="${path}"`;
            return [
                `.custom-icon .internal-link[${selector}]::before {`,
                `content: '';`,
                `display: inline-block;`,
                `width: 16px;`,
                `height: 16px;`,
                `margin: 0px 2px -2px 0px;`,
                `background-color: transparent;`,
                `background-blend-mode: normal;`,
                `background-image: url("${iconUrl}");`,
                `background-size: contain;`,
                `background-repeat: no-repeat;`,
                `}`
            ].join('\n');
        });
        return body.join('\n\n');
    }

    svgToDataURI(svgContent: string): string {
        const encodedSVG = encodeURIComponent(svgContent);
        const dataURI = `data:image/svg+xml;charset=utf-8,${encodedSVG}`;
        return dataURI;
    }
    
    getResourcePath(path: string): string {
        let resourcePath = this.app.vault.adapter.getResourcePath("");
		this.resourceBase = resourcePath.match(/(app:\/\/\w*?)\//)?.[1] as string;

        if (/^(https?:\/\/|data:)/.test(path)) {
            return path;
        }
    
        if (path.startsWith("<svg")) {
            return this.svgToDataURI(path);
        }
    
        const adapter = this.app.vault.adapter;
    
        if (path.startsWith("/")) {
            return this.resourceBase + path;
        } else if (/^[c-zC-Z]:[\/\\]/.test(path)) {
            return this.resourceBase +path.replace(/\\/g, '/').replace(/^([c-zC-Z]):/, '/$1:')
        } else {
            return adapter.getResourcePath(path);
        }
    }

    getThemeColorVariable(variableName: string): string {
        const style = getComputedStyle(document.body);
        return style.getPropertyValue(variableName).trim();
    }

    getLucidePath(iconName: string): string {
        const camelCaseIconName = convertToCamelCase(iconName);
        let iconSvg = lucideIcons[camelCaseIconName as keyof typeof lucideIcons];
        const iconColor = this.getThemeColorVariable('--tab-text-color-focused-active');
        if (iconSvg && iconColor) {
            iconSvg = iconSvg.replace(/stroke=".*?"/g, `stroke="${iconColor}"`);
            return this.svgToDataURI(iconSvg);
        } else {
            return this.svgToDataURI('<svg></svg>');
        }
    }

    getResourcePathwithType(path: string, type: string): string {
        let PATH = path.trim();
        switch(type){
            case 'custom':
                PATH = this.getResourcePath(path);
                break;
            case 'lucide':
                PATH = this.getLucidePath(path);
                break;
            default:
                PATH = this.getResourcePath(EMPTY_PNG_DATA_URL);
                break;
        }
        return PATH;
    }

    refreshSidebarIcons() {
        this.settings.SidebarIcons.forEach(icon => {
            document.querySelectorAll(`.workspace-tab-header[aria-label="${icon.label}"]`)
                .forEach(tabHeader => {
                    tabHeader.classList.add('custom-icon');
                    tabHeader.setAttribute('data-icon-id', icon.id);
                });
        });
        
    }
}
