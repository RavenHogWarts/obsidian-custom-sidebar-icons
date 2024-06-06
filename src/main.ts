import { Notice, Plugin } from "obsidian";
import CustomIconsSettingTab from "./ui/reactSettingTab";
import { CustomIconsConfig } from "./manager/types";
import { DEFAULT_SETTINGS } from "./setting/defaultSetting";
import "@/style/styles.css"

const css_filename = "CustomIcon-AutoGen";

export default class CustomIconsPlugin extends Plugin {
    settings: CustomIconsConfig;
    
    async onload() {
        try {
            await this.loadSettings();
            this.addSettingTab(new CustomIconsSettingTab(this.app, this));
            await this.genSnippetCSS(this);
        } catch (e) {
            new Notice('error when load plugin "Custom Icons"' + e.message);
        }
    }

    onunload() {
        // @ts-ignore
		const customCss = this.app.customCss;
		customCss.enabledSnippets.delete(css_filename);
		customCss.requestLoadSnippets();
        console.log('unloading plugin');
    }

    async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
		// console.log("[Config] loading plugins", this.settings);
	}

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async genSnippetCSS(plugin: CustomIconsPlugin) {
		const content: string[] = [
			"/* * WARNING: This file will be overwritten by plugin `Custom Icon`.",
			"   * DO NOT EDIT THIS FILE DIRECTLY!!!",
			"   * Do not edit this file directly!!!",
			"*/",
			"",
		];

		const vault = plugin.app.vault;
		const ob_config_path = vault.configDir;
		const snippets_path = ob_config_path + "/snippets";

		const path = `${snippets_path}/${css_filename}.css`;
		if (!(await vault.adapter.exists(snippets_path))) { await vault.adapter.mkdir(snippets_path); }
		if (await vault.adapter.exists(path)) { await vault.adapter.remove(path) }
		await plugin.app.vault.create(path, content.join('\n'));
		// Activate snippet
		// @ts-ignore
		const customCss = plugin.app.customCss;
		customCss.enabledSnippets.add(css_filename);
		customCss.requestLoadSnippets();
	}
}