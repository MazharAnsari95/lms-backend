const http=require('http');
const port=8020;
const app=require('./app');


const server=http.createServer(app);
server.listen(port,()=>{
console.log('server is running')
});