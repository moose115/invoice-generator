const Regon = require('regon')

const error = params => ({
  ErrorCode: [ '4' ],
  ErrorMessagePl: [ 'Nie znaleziono podmiotu dla podanych kryteriów wyszukiwania.' ],
  ErrorMessageEn: [ 'No data found for the specified search criteria.' ],
  Nip: [ params.Nip ],
  Regon: [ params.Regon ]
});

const post = async (req, res) => {
  const regon = new Regon({key: process.env.REGON_KEY})
  let data = await regon.getCompanyData({Nip: req.body.Nip})
  if(!data || data.ErrorCode) data = await regon.getCompanyData({Regon: req.body.Regon}) || error(req.body);
  return res.send(data)
}

export default (req, res) => {
  if(req.method === 'POST') return post(req, res);
}