const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
})
.then(console.log(`DB GOT CONNECTED`))
.catch(error=>{
    console.log(`DB CONNECTION ISSUE`)
    console.log(error)
    process.exit(1)
})