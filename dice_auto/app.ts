/*app.ts*/
import express, { Express } from 'express';

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();
var bodyParser = require('body-parser');
var request = require('request');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


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

app.post('/postroll',(req,res)=>{
  console.log("Dice score submitted: " + req.body);
  res.send({"message":"score submitted successfully"});
});

app.get('/ohno', (req, res) => {
 //modify the url in any way you want

 var urls = ['http://google.com/','https://astronomy.sandbox.sockshop.biz/api/products','http://unknown.observeinc.com'];
 const targ = urls[getRandomInt(urls.length)];
 console.log("making an outbound request to: " + targ );
 request(targ).pipe(res);

});


app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}/`);
});