import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as dayjs from 'dayjs';
import * as yup from 'yup';

import { Messages } from 'primereact/messages';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';

import axios from './../../Axios';
import { receiptApiEndpoints, expenseApiEndpoints } from './../../API';
import { useTracked } from './../../Store';
import CurrencySidebar from '../common/CurrencySidebar';

let messages;

// Adjust max file size in MB here.
const MAX_FILE_SIZE_MB = 16;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const createReceiptValidationSchema = yup.object().shape({
  date: yup.date().required('Receipt date is required'),
  receipt_number: yup
    .string()
    .required('Receipt number is required')
    .max(255, 'Maximum 255 characters'),
  total: yup.number().required('Total is required'),
  store: yup.string().required('Store is required').max(255, 'Maximum 255 characters'),
  // No separate expense date – it will be set from the receipt date.
  expenses: yup.array().of(
    yup.object().shape({
      category: yup.object().required('Expense category is required'),
      amount: yup.number().required('Expense amount is required'),
      spent_on: yup
        .string()
        .required('Spent on is required')
        .max(100, 'Maximum 100 characters'),
      remarks: yup.string().max(200, 'Maximum 200 characters'),
    })
  )
});

// Helper function to check if the screen is desktop.
const isDesktop = () => window.innerWidth > 1024;

/**
 * FileUploader component renders a dashed-border area that allows drag-and-drop
 * or click-to-upload. It shows a loading spinner when processing and displays
 * a preview image if available. It calls onFileSelected(file) when a file is chosen.
 */
const FileUploader = ({ onFileSelected, loading, t, imagePreviewUrl }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleClick = () => {
    document.getElementById('fileInput').click();
  };

  return (
    <div
      style={{
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {loading ? (
        <ProgressSpinner style={{ height: '50px', width: '50px' }} strokeWidth="4" />
      ) : (
        <>
          <p>{t('Drag and drop an image here, or click to select')}</p>
          <p style={{ fontSize: '0.9em', color: '#888' }}>{t('Maximum file size:')} {MAX_FILE_SIZE_MB} MB</p>
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Preview"
              style={{ maxWidth: '100%', marginTop: '10px' }}
            />
          )}
        </>
      )}
      <input
        type="file"
        id="fileInput"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

const CreateReceipt = (props) => {
  const [t] = useTranslation();
  const history = useHistory();
  const { register, handleSubmit, errors, setValue, control, reset } = useForm({
    validationSchema: createReceiptValidationSchema,
    defaultValues: {
      date: new Date(),
      receipt_number: '',
      total: '',
      store: '',
      expenses: [] 
    }
  });

  // useFieldArray to manage the "expenses" array.
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expenses'
  });

  // This key forces re-rendering of the expense rows container.
  const [expenseArrayKey, setExpenseArrayKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [state] = useTracked(); // Contains state.currentCurrency and state.currencies
  const [currencyVisible, setCurrencyVisible] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Load expense categories once.
  useEffect(() => {
    axios
      .get(expenseApiEndpoints.expenseCategory + '?sort_col=category_name&sort_order=asc')
      .then(response => {
        if (response.data.data && response.data.data.length > 0) {
          setExpenseCategories(response.data.data);
        }
      })
      .catch(error => console.error(error));
  }, []);

  // onFileSelected handler for FileUploader.
  const handleFileSelected = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      messages.show({
        severity: 'warn',
        detail: t(`File size exceeds maximum limit (${MAX_FILE_SIZE_MB} MB).`),
        sticky: false,
        closable: true,
        life: 5000
      });
      return;
    }
    setReceiptImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));

    // Show loading spinner while processing image.
    setImageLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    axios
      .post(receiptApiEndpoints.parseImage, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(response => {
        setImageLoading(false);
        console.log(response.data);
        const parsedData = response.data.data;
        // Build new expenses array from parsed data.
        const newExpenses = parsedData.expenses.map(exp => ({
          category: expenseCategories.find(c => c.id === exp.category_id) || { id: exp.category_id, category_name: 'Category ' + exp.category_id },
          amount: exp.amount,
          spent_on: exp.spent_on,
          remarks: exp.remarks || ''
        }));
        // Reset the form.
        reset({
          date: new Date(parsedData.date),
          receipt_number: parsedData.receipt_number,
          total: parsedData.total,
          store: parsedData.store,
          expenses: newExpenses
        });
        messages.show({
          severity: 'success',
          detail: t('Image processed successfully.'),
          sticky: false,
          closable: false,
          life: 5000
        });
      })
      .catch(error => {
        setImageLoading(false);
        messages.show({
          severity: 'error',
          detail: t('Error processing image.'),
          sticky: true,
          closable: true,
          life: 5000
        });
      });
  };

  const addExpenseRow = () => {
    append({
      category: null,
      amount: '',
      spent_on: '',
      remarks: ''
    });
  };

  const submitReceipt = (data) => {
    setSubmitting(true);
    const processedExpenses = (data.expenses || []).map(exp => ({
      transaction_date: dayjs(data.date).format('YYYY-MM-DD HH:mm:ss'),
      category_id: exp.category.id,
      amount: exp.amount,
      spent_on: exp.spent_on,
      remarks: exp.remarks,
      currency_id: state.currentCurrency ? state.currentCurrency.id : null
    }));

    const payload = {
      date: dayjs(data.date).format('YYYY-MM-DD'),
      receipt_number: data.receipt_number,
      total: data.total,
      store: data.store,
      currency_id: state.currentCurrency.id,
      expenses: processedExpenses
    };

    axios
      .post(receiptApiEndpoints.receipt, JSON.stringify(payload))
      .then(response => {
        if (response.status === 201) {
          setSubmitting(false);
          messages.show({
            severity: 'success',
            detail: t('Your receipt info added successfully.'),
            sticky: false,
            closable: false,
            life: 5000
          });
          history.goBack();
        }
      })
      .catch(error => {
        setSubmitting(false);
        messages.clear();
        if (error.response && error.response.status === 422) {
          // Handle validation errors if needed.
        } else if (error.response && error.response.status === 401) {
          messages.show({
            severity: 'error',
            detail: t('Something went wrong. Try again.'),
            sticky: true,
            closable: true,
            life: 5000
          });
        }
      });
  };

  const formContent = (
    <Card className="rounded-border">
      <div className="p-card-title">{t('Add Receipt')}</div>
      <div className="p-card-subtitle">{t('Add your receipt information along with related expenses below.')}</div>
      <br />
      <form onSubmit={handleSubmit(submitReceipt)}>
        <div className="p-fluid">
          <label>{t('Receipt Date')}</label>
          <Controller
            name="date"
            onChange={([e]) => e.value}
            control={control}
            defaultValue={new Date()}
            as={<Calendar dateFormat="yy-mm-dd" showButtonBar touchUI={window.innerWidth < 768} />}
          />
          <p className="text-error">{errors.date?.message}</p>
        </div>
        <div className="p-fluid">
          <label>{t('Receipt Number')}</label>
          <input type="text" ref={register} name="receipt_number" className="p-inputtext p-component p-filled" placeholder={t('Receipt Number')} />
          <p className="text-error">{errors.receipt_number?.message}</p>
        </div>
        <div className="p-fluid">
          <label>{t('Total')}</label>
          <div className="p-inputgroup">
            <input type="number" step="0.01" ref={register} name="total" keyfilter="money" placeholder={t('Total')} className="p-inputtext p-component p-filled" />
            <Button
              type="button"
              label={`${state.currencies.length === 0 ? t('loading') : state.currentCurrency.currency_code}`}
              onClick={() => setCurrencyVisible(true)}
            />
          </div>
          <p className="text-error">{errors.total?.message}</p>
        </div>
        <div className="p-fluid">
          <label>{t('Store')}</label>
          <input type="text" ref={register} name="store" className="p-inputtext p-component p-filled" placeholder={t('Store')} />
          <p className="text-error">{errors.store?.message}</p>
        </div>
        <hr />
        <div className="p-fluid">
          <div className="p-card-title">{t('Expenses')}</div>
          <div key={expenseArrayKey}>
            {fields.map((item, index) => (
              <Card key={`expense.${index}`} className="p-mb-2">
                <div className="p-grid">
                  <div className="p-col-12">
                    <div className="p-fluid">
                      <label>{t('Expense Category')}</label>
                      <Controller
                        name={`expenses.${index}.category`}
                        onChange={([e]) => e.value}
                        control={control}
                        defaultValue={item.category || null}
                        as={
                          <Dropdown
                            filter
                            filterPlaceholder={t('Search here')}
                            showClear
                            options={expenseCategories}
                            placeholder={t('Select Category')}
                            optionLabel="category_name"
                          />
                        }
                      />
                      <p className="text-error">{errors.expenses && errors.expenses[index]?.category?.message}</p>
                    </div>
                    <div className="p-fluid">
                      <label>{t('Amount')}</label>
                      <div className="p-inputgroup">
                        <input
                          type="number"
                          step="0.01"
                          ref={register}
                          keyfilter="money"
                          name={`expenses.${index}.amount`}
                          className="p-inputtext p-component p-filled"
                          placeholder={t('Amount')}
                        />
                        <Button
                          type="button"
                          label={`${state.currencies.length === 0 ? t('loading') : state.currentCurrency.currency_code}`}
                          onClick={() => setCurrencyVisible(true)}
                        />
                      </div>
                      <p className="text-error">{errors.expenses && errors.expenses[index]?.amount?.message}</p>
                    </div>
                    <div className="p-fluid">
                      <label>{t('Spent On')}</label>
                      <input
                        type="text"
                        ref={register}
                        name={`expenses.${index}.spent_on`}
                        className="p-inputtext p-component p-filled"
                        placeholder={t('Spent On')}
                      />
                      <p className="text-error">{errors.expenses && errors.expenses[index]?.spent_on?.message}</p>
                    </div>
                    <div className="p-fluid">
                      <label>{t('Remarks')}</label>
                      <textarea
                        ref={register}
                        name={`expenses.${index}.remarks`}
                        rows={3}
                        className="p-inputtext p-inputtextarea p-component p-inputtextarea-resizable"
                        placeholder={t('Remarks')}
                      />
                      <p className="text-error">{errors.expenses && errors.expenses[index]?.remarks?.message}</p>
                    </div>
                  </div>
                  <div className="p-col-12" style={{ textAlign: 'right' }}>
                    <Button
                      label={t('Remove Expense')}
                      icon="pi pi-minus"
                      className="p-button-danger"
                      onClick={() => remove(index)}
                      type="button"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button
            label={t('Add Expense')}
            type="button"
            icon="pi pi-plus"
            onClick={addExpenseRow}
            className="p-button-raised"
          />
        </div>
        <div className="p-fluid p-mt-2">
          <Button disabled={submitting} type="submit" label={t('Save Receipt')} icon="pi pi-save" className="p-button-raised" />
        </div>
      </form>
    </Card>
  );

  return (
    <div>
      <Helmet title={t("Add Receipt")} />
      <CurrencySidebar visible={currencyVisible} onHide={() => setCurrencyVisible(false)} />
      <div className="p-grid p-nogutter">
        <div className="p-col-12">
          <Messages ref={el => messages = el} />
        </div>
      </div>
      {isDesktop() ? (
        <div className="p-grid">
          {/* Left: Form */}
          <div className="p-col-6">{formContent}</div>
          {/* Right: FileUploader for image */}
          <div className="p-col-6">
            <Card className="rounded-border" style={{ textAlign: 'center' }}>
              <div className="p-card-title">{t("Receipt Image")}</div>
              <FileUploader
                onFileSelected={handleFileSelected}
                loading={imageLoading}
                t={t}
                imagePreviewUrl={imagePreviewUrl}
              />
            </Card>
          </div>
        </div>
      ) : (
        <div>
          {/* On smaller screens: FileUploader on top */}
          <Card className="rounded-border" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div className="p-card-title">{t("Receipt Image")}</div>
            <FileUploader
              onFileSelected={handleFileSelected}
              loading={imageLoading}
              t={t}
              imagePreviewUrl={imagePreviewUrl}
            />
          </Card>
          {formContent}
        </div>
      )}
    </div>
  );
};

export default CreateReceipt;
