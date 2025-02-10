// src/receipt/EditReceipt.jsx
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm, Controller } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as dayjs from 'dayjs';
import * as yup from 'yup';

import { Messages } from 'primereact/messages';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';

import axios from './../../Axios';
import { receiptApiEndpoints } from './../../API';
import CurrencySidebar from '../common/CurrencySidebar';
import { useTracked } from '../../Store';

let messages;

const editReceiptValidationSchema = yup.object().shape({
  date: yup.date().required('Receipt date is required'),
  receipt_number: yup.string().required('Receipt number is required').max(255, 'Maximum 255 characters'),
  total: yup.number().required('Total is required'),
  store: yup.string().required('Store is required').max(255, 'Maximum 255 characters'),
});

const EditReceipt = (props) => {

    const [t] = useTranslation();

    const history = useHistory();

    const { register, handleSubmit, errors, setValue, control } = useForm({
        validationSchema: editReceiptValidationSchema,
    });
    const [submitting, setSubmitting] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [state] = useTracked();
    const [currencyVisible, setCurrencyVisible] = useState(false);

    useEffect(() => {
        axios.get(receiptApiEndpoints.receipt + '/' + props.match.params.receipt_id)
        .then(response => {
            setReceipt(response.data);
            setValue('date', dayjs(response.data.date).toDate());
            setValue('receipt_number', response.data.receipt_number);
            setValue('total', response.data.total);
            setValue('store', response.data.store);
        })
        .catch(error => {
            console.error(error);
        });
    }, [props.match.params.receipt_id, setValue]);

    const submitUpdateReceipt = (data) => {
        setSubmitting(true);
        data.date = dayjs(data.date).format('YYYY-MM-DD');
        axios.put(receiptApiEndpoints.receipt + '/' + props.match.params.receipt_id, JSON.stringify(data))
        .then(response => {
            if (response.status === 200) {
                setSubmitting(false);
                messages.show({
                    severity: 'success',
                    detail: t('Your receipt info updated successfully.'),
                    sticky: false,
                    closable: false,
                    life: 5000,
                });

                history.goBack();
            }
        })
        .catch(error => {
            setSubmitting(false);
            messages.clear();
            if (error.response && error.response.status === 422) {
            // Process and display validation errors if needed.
            } else if (error.response && error.response.status === 401) {
            messages.show({
                severity: 'error',
                detail: t('Something went wrong. Try again.'),
                sticky: true,
                closable: true,
                life: 5000,
            });
            }
        });
    };

    if (!receipt) {
        return <div>{t("Loading...")}</div>;
    }

    return (
        <div>
        <Helmet title={t("Edit Receipt")} />
        
        <CurrencySidebar visible={currencyVisible} onHide={(e) => setCurrencyVisible(false)} />

        <Messages ref={(el) => messages = el} />

        <Card className="rounded-border">
            <div className="p-card-title p-grid p-nogutter p-justify-between">{t("Edit Receipt")}</div>
            <div className="p-card-subtitle">{t("Edit selected receipt information below.")}</div>
            <br />
            <form onSubmit={handleSubmit(submitUpdateReceipt)}>
            <div className="p-fluid">
                <label>{t("Receipt Date")}</label>
                <Controller
                name="date"
                onChange={([e]) => e.value}
                control={control}
                defaultValue={new Date()}
                as={
                    <Calendar dateFormat="yy-mm-dd" showButtonBar touchUI={window.innerWidth < 768} />
                }
                />
                <p className="text-error">{errors.date?.message}</p>
            </div>
            <div className="p-fluid">
                <label>{t("Receipt Number")}</label>
                <input type="text" ref={register} name="receipt_number" className="p-inputtext p-component p-filled" placeholder={t("Receipt Number")} />
                <p className="text-error">{errors.receipt_number?.message}</p>
            </div>
            <div className="p-fluid">
                <label>{t("Total")}</label>
                <div className="p-inputgroup">
                    <input type="number" step="0.01" ref={register} keyfilter="money" name="total" className="p-inputtext p-component p-filled" placeholder={t("Total")} />
                    <Button
                        label={`${state.currencies.length === 0 ? t("loading") : state.currentCurrency.currency_code}`}
                        type="button"
                        onClick={(e) => setCurrencyVisible(true)} />
                </div>
                <p className="text-error">{errors.total?.message}</p>
            </div>
            <div className="p-fluid">
                <label>{t("Store")}</label>
                <input type="text" ref={register} name="store" className="p-inputtext p-component p-filled" placeholder={t("Store")} />
                <p className="text-error">{errors.store?.message}</p>
            </div>
            <div className="p-fluid">
                <Button disabled={submitting} type="submit" label={t("Save Changes")} icon="pi pi-save" className="p-button-raised" />
            </div>
            </form>
            <hr />
            <div className="p-card-title">{t("Expenses for this Receipt")}</div>
            { receipt.expenses && receipt.expenses.length > 0 ? (
            <div>
                {receipt.expenses.map((expense) => (
                <Card key={expense.id} className="p-mb-2">
                    <div>
                    <p><strong>{t("Spent On")}: </strong> {expense.spent_on}</p>
                    <p><strong>{t("Amount")}: </strong> {expense.amount.toLocaleString()}</p>
                    <p><strong>{t("Date")}: </strong> {dayjs(expense.transaction_date).format("YYYY-MM-DD HH:mm")}</p>
                    <p><strong>{t("Remarks")}: </strong> {expense.remarks}</p>
                    </div>
                    <Button
                        label={t("Edit Expense")}
                        icon="pi pi-pencil"
                        className="p-button-raised p-button-info"
                        onClick={() => props.history.push(`/expense/${expense.id}/edit`)} />
                </Card>
                ))}
            </div>
            ) : (
            <p>{t("No expenses found for this receipt.")}</p>
            )}
        </Card>
        </div>
    );
};

export default EditReceipt;
