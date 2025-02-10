import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from 'primereact/sidebar';
import Calculator from "./calculator/Calculator";

const ToolsSidebar = (props) => {
  const [t] = useTranslation();
  
  return (
    <Sidebar visible={props.visible} position="right" onHide={props.onHide} style={{ width: '345px' }}>
      <h1 className="p-card-title">{t('Tools')}</h1>
      {props.visible && <Calculator isVisible={props.visible} />}
    </Sidebar>
  );
}

export default React.memo(ToolsSidebar);
