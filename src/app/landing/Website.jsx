import React from 'react'
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import LandingLayout from './../layouts/LandingLayout';

const Website = (props) => {
  const [t] = useTranslation();
  
  return (
    <LandingLayout>
      <div className="p-grid p-nogutter p-align-center p-justify-center" style={{ height: '95vh' }}>
        <img src={require('./../../logo.png')} alt="" style={{ height: '20vh' }} />
        <div>
          <h1 className="color-title">{t("Expense")}</h1>
          <h1 className="color-title">{t("Manager")}</h1>
          <p>
            <Link to="/login">{t("Login")}</Link><span className="color-title"> | </span><Link to="/register">{t("Register")}</Link>
          </p>
        </div>
      </div>
    </LandingLayout>
  )
}

export default Website;
