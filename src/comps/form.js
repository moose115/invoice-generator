import React, { useEffect } from 'react';
import { useForm, useFieldArray, ErrorMessage, useFormContext, FormContext } from 'react-hook-form';
import styled from 'styled-components';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import dd from '../utils/invoice_definition';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const StyledForm = styled.form`
width: 100vw;
margin: 0 auto;
padding: 30px;
display: grid;
grid-template-areas:
  "seller"
  "buyer"
  "stock";
color: #eee;
text-align: center;

@media(min-width: 800px) {
  width: 90vw;
  grid-template-areas:
    "seller stock"
    "buyer stock";
  grid-template-columns: 1fr 3fr;
}
`;

const FieldList = styled.ul`
margin: 0;
padding: 0;
border: none;
grid-area: ${ ({ area }) => area};
`;

const FieldItem = styled.li`
display: flex;
justify-content: center;
${ ({column}) => !column && '' }
flex-wrap: wrap;
${ ({column}) => column && `
  flex-direction: column;
  align-content: flex-start;
` }
`;

const Label = styled.label`
padding: 5px;
`;

const StyledInput = styled.input`
padding: 5px 10px;
display: block;
border-radius: 2px;
border: 1px solid #219abb;

&:focus {
  margin: -1px;
  border: 2px solid #017a9b;
}
`;

const Select = styled.select`
padding: 5px 10px;
display: block;
border-radius: 2px;
border: 1px solid #219abb;

&:focus {
  margin: -1px;
  border: 2px solid #017a9b;
}
`;

const Button = styled.button`
min-width: 30px;
min-height: 30px;
margin: 5px;
align-self: center;
background: #219abb;
border: none;
color: #eee;
cursor: pointer;

@media(min-width: 720px) {
  &:hover {
    background: #017a9b;
  }
}
`;

const StyledError = styled.p`
margin: 5px;
color: #bf1650;
font-size: .8em;

&:before {
  display: inline;
  content: "⚠ ";
}
`;

const Input = (props) => {
  const { register, errors } = useFormContext();
  return (
    <>
      <StyledInput ref={register({required: 'To pole jest wymagane'})} {...props} />
      <ErrorMessage errors={errors} name={props.name} as={<StyledError />} />
    </>
  );
};

const Company = ({title, who, register, children}) => {

  const onlyNumber = e => {
    const key = e.code || e.keyCode || e.which;
    if (!( [8, 9, 13, 27, 46, 110, 190].indexOf(key) !== -1 ||
    (key === 65 && ( e.ctrlKey || e.metaKey  ) ) || 
    (key >= 35 && key <= 40) ||
    (key >= 48 && key <= 57 && !(e.shiftKey || e.altKey)) ||
    (key >= 96 && key <= 105)
    )) e.preventDefault();
  }
  
  const zipCodeChange = e => {
    const value = e.target.value;
    const keyCode = e.code || e.keyCode || e.which;
    onlyNumber(e);
    if (value && value.length === 2 && keyCode !== 8) {
      e.target.value += '-';
    }
    if (keyCode === 46 || keyCode === 8) {
      e.target.value = '';
    } 
    else if (keyCode === 86) {
      e.preventDefault();;
    }
  };

  return (
    <FieldItem column>
      <h2>{title}</h2>
      <Label>
        Nazwa
        <Input name={who + '.name'} />
      </Label>
      <Label>
        Miejscowość
        <Input name={who + '.city'} />
      </Label>
      <Label>
        Ulica i nr
        <Input name={who + '.street'} />
      </Label>
      <Label>
        Kod pocztowy
        <Input
          name={who + '.zipCode'}
          maxLength={6}
          onKeyDown={zipCodeChange}
        />
      </Label>
      <Label>
        NIP
        <Input
          name={who + '.nip'}
          maxLength={10}
          onKeyDown={onlyNumber}
        />
      </Label>
      <Label>
        REGON
        <Input
          name={who + '.regon'}
          maxLength={14}
          onKeyDown={onlyNumber}
        />
      </Label>
      {children}
    </FieldItem>    
  )
};

const Form = () => {
  const methods = useForm()
  const { register, control, getValues, setValue, triggerValidation, errors, setError, clearError } = methods;

  const required = params => register({
    required: true,
    ...params
  })

  const { fields, append, remove } = useFieldArray({ control: control, name: 'items' });

  useEffect(() => {
    append();
  }, [append, clearError]);

  const addItem = e => {
    append();
  };

  const fetchCompany = async e => {
    const valid = await triggerValidation('buyer.nip') || await triggerValidation('buyer.regon');
    if(!valid) return setError('fetch', 'required', 'Wpisz NIP lub REGON');
    else clearError('fetch');
    const body = {
      Nip: getValues('buyer.nip') || '',
      Regon: getValues('buyer.regon' || '')
    };
    const data = await fetch('/api/company',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    );
    const {
      Regon,
      Nip,
      Nazwa,
      Miejscowosc,
      KodPocztowy,
      Ulica,
      NrNieruchomosci,
      ErrorCode

    } = await data.json();
    if(ErrorCode) return setError('fetch', 'emptyResponse', 'Nie znaleziono');
    else clearError('fetch');
    setValue('buyer.name', Nazwa);
    setValue('buyer.city', Miejscowosc);
    setValue('buyer.street', `${Ulica} ${NrNieruchomosci}`);
    setValue('buyer.zipCode', KodPocztowy);
    setValue('buyer.nip', Nip);
    setValue('buyer.regon', Regon);
  };

  const setGross = i => {
    const net = parseFloat(getValues(`items[${i}].priceNet`));
    const tax = parseFloat(getValues(`items[${i}].tax`));
    const gross = net + net * tax;
    console.log(net, tax)
    setValue(`items[${i}].priceGross`, Math.round(gross * 100) / 100 || 0);
    console.log(getValues(`items[${i}].priceGross`))
  }

  const setNet = i => {
    const gross = parseFloat(getValues(`items[${i}].priceGross`));
    const tax = parseFloat(getValues(`items[${i}].tax`));
    const net = gross / (1 + tax);
    setValue(`items[${i}].priceNet`, Math.round(net * 100) / 100 || 0);
  }

  const genInvoice = async () => {
    const valid = await triggerValidation();
    if(!valid) return;
    pdfMake.createPdf(dd(getValues({nest: true}))).open();
  }

  return (
    <FormContext {...methods}>
    <StyledForm>
      <FieldList area="seller">
        <Company title="Sprzedawca" who="seller" register={required}/>
      </FieldList>
      <FieldList area="buyer">
          <Company title="Nabywca" who="buyer" register={required}>
            <Button type="button" onClick={fetchCompany}>Uzupełnij z bazy</Button>
            <ErrorMessage errors={errors} name="fetch" as={<StyledError />} />
          </Company>
      </FieldList>
      <FieldList area="stock">
        <h2>Dane do faktury</h2>
        {
          fields.map( (item, i) => (
            <FieldItem key={item.id}>
              <Label>
                Nazwa towaru/usługi
                <Input  
                  name={`items[${i}].name`}
                  defaultValue={item.name}
                  placeholder="Nazwa towaru/usługi"
                />
              </Label>
              <Label>
                Ilość
                <Input  
                  name={`items[${i}].quantity`}
                  type="number"
                  defaultValue={item.quantity || 1}
                  placeholder="Ilość"
                  min="1"
                />
              </Label>
              <Label>
                Cena netto
                <Input  
                  name={`items[${i}].priceNet`}
                  defaultValue={item.priceNet || 0}
                  placeholder="Cena netto"
                  onBlur={ () => setGross(i) }
                />
              </Label>
              <Label>
                Cena brutto
                <Input  
                  name={`items[${i}].priceGross`} 
                  defaultValue={item.priceGross || 0}
                  placeholder="Cena brutto"
                  onBlur={ () => setNet(i) }
                />
              </Label>
              <Label>
                Stawka podatku
                <Select
                  ref={register({required: 'To pole jest wymagane'})}
                  name={`items[${i}].tax`}
                  defaultValue={item.tax}
                  id="tax"
                  onChange={() => setGross(i) }
                >
                  <option value="0.23">23%</option>
                  <option value="0.08">8%</option>
                  <option value="0.05">5%</option>
                  <option value="0">0%</option>
                  <option value="0">St. zw.</option>
                </Select>
              </Label>
              <Button type="button" onClick={() => remove(i) }>X</Button>
            </FieldItem>
          ))
        }
        <Button type="button" onClick={addItem}>Dodaj</Button>
        <Button type="button" onClick={genInvoice}>Wygeneruj</Button>
      </FieldList>
    </StyledForm>
    </FormContext>
  );
}

export default Form;