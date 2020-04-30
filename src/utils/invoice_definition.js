import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const date = (city) => ({
  margin: [0, 0, 0, 10],
  text: new Date().toLocaleDateString() + ` ${city}`,
  alignment: 'right'
});

const party = (who, {name, city, street, zipCode, nip, regon}) => ({
  stack: [
    {
      text: who,
      bold: true,
      margin: [0,0,0,5]
    },
    name,
    street,
    `${zipCode} ${city}`,
    `NIP: ${nip}`,
    `REGON: ${regon}`

  ],
  width: 'auto'
});

const table = (items) => [
  ['Lp.', 'Towar / Usługa', 'Ilość', 'Cena netto', 'VAT', 'Cena brutto', 'Stawka podatku'].map( el => ({text: el, bold: true})),
  ...items.map( ({name, quantity, priceNet, priceGross, tax}, i) => [
    i + 1,
    name || { text: '(nie podano)', italics: true },
    quantity,
    priceNet,
    Math.round(100 * (priceGross - priceNet)) / 100,
    priceGross,
    parseFloat(tax) * 100 + '%'
  ])
];

const summary = (items = []) => {

  const netArr = items.map( item => parseFloat(item.priceNet) )
  const grossArr = items.map( item => parseFloat(item.priceGross) )

  const sum = items.reduce( (prev, cur) => {
    console.log(prev, cur)
    return ({
      net: parseFloat(prev.net) + parseFloat(cur.priceNet) * parseFloat(cur.quantity || 1),
      gross: parseFloat(prev.gross) + parseFloat(cur.priceGross) * parseFloat(cur.quantity || 1),
    })
  },
  {
    net: 0,
    gross: 0,
    tax: 0
  })

  console.log(sum)

  return [
    [{ text: 'Razem', bold: true }, ''],
    ['Netto', Math.round(sum.net * 100) / 100],
    ['Brutto', Math.round(sum.gross * 100) / 100],
    ['VAT', Math.round( (sum.gross - sum.net) * 100 ) / 100]
  ]
}

const sign = who => ({
  stack: [
    {
      margin: [10, 50, 0, 0],
      text: '....................................................'
    },
    {
      text: who,
      italics: true,
      fontSize: 8
    }
  ],
  width: 'auto',
  alignment: 'center'
})

const dd = ({seller, buyer, items}) => ({
  content: [
    date(seller.city),
    {
      text: 'Faktura',
      style: 'heading'
    },
    {
        columns: [
        party('Sprzedawca', seller),
        {
        },
        party('Nabywca', buyer)
      ],
      margin: [0,10,0,10]
    },
    {
      margin: [0,10,0,10],
      table: {
        headerRows: 1,
        widths: [...new Array(7)].map( (el, i) => i !== 1 ? 'auto' : '*' ),
				body: table(items)
      },
			layout: 'lightHorizontalLines'
    },
    {
      columns: [
        {width: '*', text: ''},
        {
          width: 'auto',
          table: {
            headerRows: 1,
            body: summary(items)
          },
          layout: {
            hLineWidth: (i) => i === 1 ? 1 : 0,
            vLineWidth: () => 0,
            hLineColor: () => 'gray'
          }
        }
      ]
    },
    {
      columns: [
        sign('(sprzedawca)'),
        {},
        sign('(nabywca)')
      ],
    }
  ],
  defaultStyle: {
    fontSize: 10
  },
  styles: {
    heading: {
      fontSize: 18,
      alignment: 'center'
    }
  }
});

export default dd;