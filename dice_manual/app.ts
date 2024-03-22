/*app.ts*/
import express, { Express } from 'express';

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();
const axios = require('axios');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
var inspect = require('util').inspect;


function getURL(url:string) {
	const options = {
		method: 'GET',
		url: url,
        maxRedirects: 0
	};
	axios.request(options)
		.then(function ({ data }: { data: Object }) {
			console.log(data);
      		return data;
		})
		.catch(function (error: any) {
			console.error(error);
		});
}

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

app.get('/rolldice', (req, res) => {
  console.log("someone has rolled the dice");
  res.send(getRandomNumber(1, 6).toString());
});

app.get('/', (req, res) => {
  res.send();
});

app.post('/postroll',(req:express.Request,res)=>{
  const body_content = req.body
  console.log("Dice score submitted: " + inspect(body_content));
  res.send({"message":"score submitted successfully"});
});

app.get('/ohno', (req, res) => {
 //modify the url in any way you want

 var urls = ['http://www.google.com/','https://astronomy.sandbox.sockshop.biz/api/products','http://unknown.observeinc.com'];
 const targ = urls[getRandomInt(urls.length)];

 console.log("making an outbound request to: " + targ );
 res.send(getURL(targ));

});


app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}/`);
});