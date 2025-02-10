import React from 'react'
import { useTranslation } from 'react-i18next';

const PageNotFound = (props) => {

  const [t] = useTranslation();
  
  return (
    <div style={{ padding: '5em' }}>
      <div className="p-grid p-align-center p-justify-center">
        <div className="color-title" style={{ fontSize: 72 }}>404</div>
      </div>
      <p className="p-grid p-justify-center p-card-subtitle">{t("Make sure you know where you're going.")}</p>
    </div>
  )

}

export default React.memo(PageNotFound);
