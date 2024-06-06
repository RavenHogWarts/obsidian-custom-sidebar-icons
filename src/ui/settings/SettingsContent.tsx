import React from 'react';
import SidebarTab from "./contents/SidebarTab";
import SidebarSubTab1 from "./contents/SidebarSubTab1";
import FolderTab from "./contents/FolderTab";
import FolderSubTab1 from "./contents/FolderSubTab1";
import FolderSubTab2 from "./contents/FolderSubTab2";
import EditorTab from "./contents/EditorTab";
import EditorSubTab1 from "./contents/EditorSubTab1";
import AboutTab from "./contents/AboutTab";

interface SettingsContentProps {
  activeTab: string;
  activeSubTab: string;
}

const componentsMap: {[key: string]: React.ComponentType<any>} = {
  SidebarTab: SidebarTab,
  SidebarSubTab1: SidebarSubTab1,
  FolderTab: FolderTab,
  FolderSubTab1: FolderSubTab1,
  FolderSubTab2: FolderSubTab2,
  EditorTab: EditorTab,
  EditorSubTab1: EditorSubTab1,
  AboutTab: AboutTab,
};

const SettingsContent: React.FC<SettingsContentProps> = ({ activeTab, activeSubTab }) => {
  const TabComponent  = componentsMap[activeTab];
  const SubTabComponent = componentsMap[activeSubTab];

  if (!activeSubTab) {
    return (
      <div className="csbi-setting-content">
        <div className="csbi-setting-tab-content">
          {TabComponent  ? <TabComponent  /> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="csbi-setting-content">
      <div className="csbi-setting-subTab-content">
        {SubTabComponent ? <SubTabComponent /> : null}
      </div>
    </div>
  );
};

export default SettingsContent;