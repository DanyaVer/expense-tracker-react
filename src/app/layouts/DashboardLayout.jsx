import React, { useState, useEffect } from 'react'
import classNames from 'classnames';
import { Route, Switch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ScrollPanel } from 'primereact/scrollpanel';

import AppTopbar from './../dashboard/AppTopbar';
import AppInlineProfile from './../dashboard/AppInlineProfile';
import AppMenu from './../dashboard/AppMenu';
import AppFooter from './../dashboard/AppFooter';

import Dashboard from './../dashboard/Dashboard';
import ExpenseCategory from './../expense/ExpenseCategory';
import Expense from './../expense/Expense';
import EditExpense from './../expense/EditExpense';
import Income from './../income/Income';
import EditIncome from './../income/EditIncome';
import Profile from './../profile/Profile';
import EditProfile from './../profile/EditProfile';
import EditExpenseCategory from './../expense/EditExpenseCategory';
import IncomeCategory from './../income/IncomeCategory';
import EditIncomeCategory from './../income/EditIncomeCategory';
import TransactionCalendar from './../calendar/TransactionCalendar';
import Analytics from './../analytics/Analytics';
import Setting from './../setting/Setting';
import ScrollToTop from './../dashboard/ScrollToTop';
import PageNotFound from './../errors/404';

import { logout } from './../../Axios';
import { PrivateRoute } from './../../Routes';
import { useTracked } from './../../Store';
import EditReceipt from '../receipt/EditReceipt';
import Receipt from '../receipt/Receipt';
import CreateReceipt from '../receipt/CreateReceipt';
import ReceiptDetails from '../receipt/ReceiptDetails';

const isDesktop = (width) => {
  return (width || window.innerWidth) > 1024;
};

const DashboardLayout = (props) => {

  const [t] = useTranslation();
  
  const menu = [
    { label: t('Dashboard'), url: '/dashboard', icon: 'pi pi-fw pi-home', command: () => { } },
    { label: t('Receipt'), url: '/receipt', icon: 'pi pi-fw pi-file', command: () => { } },
    {
      label: t('Expense'), url: '', icon: 'pi pi-fw pi-dollar',
      items: [
        { label: t('Manage'), url: '/expense', icon: 'pi pi-fw pi-plus', command: () => { } },
        { label: t('Category'), url: '/expense/category', icon: 'pi pi-fw pi-list', command: () => { } },
      ]
    },
    // {
    //   label: t('Income'), url: '', icon: 'pi pi-fw pi-money-bill',
    //   items: [
    //     { label: t('Manage'), url: '/income', icon: 'pi pi-fw pi-plus', command: () => { } },
    //     { label: t('Category'), url: '/income/category', icon: 'pi pi-fw pi-list', command: () => { } },
    //   ]
    // },
    { label: t('Calendar'), url: '/calendar', icon: 'pi pi-fw pi-calendar', command: () => { } },
    { label: t('Analytics'), url: '/analytics', icon: 'pi pi-fw pi-chart-bar', command: () => { } },
    { label: t('Settings'), url: '/setting', icon: 'pi pi-fw pi-cog', command: () => { } },
    { label: t('Profile'), url: '/profile', icon: 'pi pi-fw pi-user', command: () => { } },
    { label: t('Logout'), url: '', icon: 'pi pi-fw pi-power-off', command: () => logout() },
  ];

  const [state] = useTracked();

  const [staticMenuInactive, setStaticMenuInactive] = useState(false);
  const [overlayMenuActive, setOverlayMenuActive] = useState(false);
  const [mobileMenuActive, setMobileMenuActive] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      let isDesktopNow = isDesktop();

      if (isDesktop(windowWidth) !== isDesktopNow) {
        if (mobileMenuActive && isDesktopNow) {
          setMobileMenuActive(false);
        }
        if (overlayMenuActive && !isDesktopNow) {
          setOverlayMenuActive(false);
        }
      }

      setWindowWidth(window.innerWidth);
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [windowWidth]); 

  const onToggleMenu = () => {
    if (isDesktop()) {
      if (state.layoutMode === 'overlay') {
        setOverlayMenuActive(!overlayMenuActive);
      }
      else if (state.layoutMode === 'static') {
        setStaticMenuInactive(!staticMenuInactive);
      }
    }
    else {
      setMobileMenuActive(!mobileMenuActive)
    }
  }

  /**
   * If menu item has no child, this function will
   * close the menu on item click. Else it will
   * open the child drawer.
   */
  const onMenuItemClick = (event) => {
    if (!event.item.items) {
      setMenuInactive();
    }
  }

  const setMenuInactive = () => {
    setOverlayMenuActive(false);
    setMobileMenuActive(false);
  }

  let logo = state.layoutColorMode === 'dark' ? require('./../../assets/logo-sidebar.png') : require('./../../assets/logo-sidebar.png');
  let wrapperClass = classNames('layout-wrapper', {
    'layout-overlay': state.layoutMode === 'overlay',
    'layout-static': state.layoutMode === 'static',
    'layout-static-sidebar-inactive': staticMenuInactive && state.layoutMode === 'static',
    'layout-overlay-sidebar-active': overlayMenuActive && state.layoutMode === 'overlay',
    'layout-mobile-sidebar-active': mobileMenuActive
  });
  let sidebarClassName = classNames("layout-sidebar", { 'layout-sidebar-dark': state.layoutColorMode === 'dark' });

  return (
    <div className={wrapperClass}>
      <AppTopbar onToggleMenu={onToggleMenu} />

      <div className={sidebarClassName}>
        <ScrollPanel style={{ height: '100%' }}>
          <div className="layout-sidebar-scroll-content">
            <div className="layout-logo">
              <img alt="Logo" src={logo} style={{ height: '80px' }} />
            </div>
            <AppInlineProfile />
            <AppMenu model={menu} onMenuItemClick={onMenuItemClick} />
          </div>
        </ScrollPanel>
      </div>
      <div className="layout-main" style={{ minHeight: '100vh', marginBottom: '-55px' }}>
        <Switch>
          <PrivateRoute exact strict path={'/dashboard'} component={Dashboard} />
          <PrivateRoute exact strict path={'/receipt'} component={Receipt} />
          <PrivateRoute exact strict path={'/receipt/create'} component={CreateReceipt} />
          <PrivateRoute exact strict path={'/receipt/:receipt_id'} component={ReceiptDetails} />
          <PrivateRoute exact strict path={'/receipt/:receipt_id/edit'} component={EditReceipt} />
          <PrivateRoute exact strict path={'/expense'} component={Expense} />
          <PrivateRoute exact strict path={'/expense/:expense_id/edit'} component={EditExpense} />
          <PrivateRoute exact strict path={'/expense/category'} component={ExpenseCategory} />
          <PrivateRoute exact strict path={'/expense/category/:category_id/edit'} component={EditExpenseCategory} />
          <PrivateRoute exact strict path={'/income'} component={Income} />
          <PrivateRoute exact strict path={'/income/:income_id/edit'} component={EditIncome} />
          <PrivateRoute exact strict path={'/income/category'} component={IncomeCategory} />
          <PrivateRoute exact strict path={'/income/category/:category_id/edit'} component={EditIncomeCategory} />
          <PrivateRoute exact strict path={'/calendar'} component={TransactionCalendar} />
          <PrivateRoute exact strict path={'/analytics'} component={Analytics} />
          <PrivateRoute exact strict path={'/setting'} component={Setting} />
          <PrivateRoute exact strict path={'/profile'} component={Profile} />
          <PrivateRoute exact strict path={'/profile/edit'} component={EditProfile} />
          <Route render={props => <PageNotFound {...props} />} />
        </Switch>
        <div style={{ height: '55px' }}>
          {/* For footer adjustment */}
        </div>
        <ScrollToTop />
      </div>
      <AppFooter />
      <div className="layout-mask" onClick={setMenuInactive} />
    </div>
  );
}

export default DashboardLayout;
