const ClassGasModule = require('ModuleGasMonitor_MQ');
let Gas = new ClassGasModule(           A3
                                       ,P11
                                       ,'MQ6'
                                       ,30000
                                       ,200
                                       ,0
                                       ,8
                                       ,3.3
                                        );
  try {
    Gas.StartReadValue();
    let ID = setInterval( ()=>{
                          try{
                            //console.log(`Gas concentration now: ${Gas.Value().toFixed(2) } ppm`);
                            //console.log(`Gas concentration now: ${Gas.Value().toFixed(2)*0.0001} %`);
                            console.log(`Gas concentration now: ${Gas.Value.toFixed(2) } ppm`);
                            console.log(`Gas concentration now: ${Gas.Value.toFixed(2)*0.0001} %`);
                          }catch(e){ console.log(e.message + '   ' + e.Code);}
         },3000);

  }
  catch(e){
    console.log(e.message + '   ' + e.Code);
  }