"use client";

import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "@/lib/supabase";


export default function JobDetail(){

const {id}=useParams();


const [job,setJob]=useState<any>(null);
const [profile,setProfile]=useState<any>(null);

const [expenses,setExpenses]=useState<any[]>([]);
const [payments,setPayments]=useState<any[]>([]);
const [workers,setWorkers]=useState<any[]>([]);
const [jobWorkers,setJobWorkers]=useState<any[]>([]);
const [workerId,setWorkerId]=useState("");

const [photos,setPhotos]=useState<any[]>([]);
const [photoFile,setPhotoFile]=useState<File|null>(null);
const [uploading,setUploading]=useState(false);

const [etype,setEtype]=useState("");
const [edesc,setEdesc]=useState("");
const [eamount,setEamount]=useState("");

const [pamount,setPamount]=useState("");
const [pmethod,setPmethod]=useState("cash");

const [commissionPaid,setCommissionPaid]=useState(false);



useEffect(()=>{

loadProfile();
load();

},[]);



async function loadProfile(){

const {
data:{
user
}
}=await supabase.auth.getUser();


if(!user) return;


const {data}=await supabase
.from("profiles")
.select("role,full_name")
.eq("id",user.id)
.single();


setProfile(data);

}





async function load(){


const {data,error}=await supabase
.from("jobs")
.select(`

*,

clients(
name,
phone,
email,
zip_code,
address
),

salesmen(
name,
commission_percent
)

`)
.eq("id",id)
.single();



if(error){

alert(error.message);
return;

}



setJob(data);



setCommissionPaid(
data.salesman_commission_paid || false
);




const {data:ex}=await supabase
.from("job_expenses")
.select("*")
.eq("job_id",id)
.order("created_at",{ascending:false});


setExpenses(ex || []);





const {data:pa}=await supabase
.from("payments")
.select("*")
.eq("job_id",id)
.order("created_at",{ascending:false});


setPayments(pa || []);





const {data:allWorkers}=await supabase
.from("workers")
.select("*")
.order("name");


setWorkers(allWorkers || []);






const {data:jw}=await supabase
.from("job_workers")
.select(`

id,
worker_id,

workers(
id,
name,
phone,
role
)

`)
.eq("job_id",id);



setJobWorkers(jw || []);





const {data:photoData}=await supabase
.from("job_photos")
.select("*")
.eq("job_id",id)
.order("created_at",{ascending:false});


setPhotos(photoData || []);


}






async function updateStatus(value:string){


await supabase
.from("jobs")
.update({

status:value

})
.eq("id",id);


load();

}







async function addExpense(){


if(Number(eamount)<=0){

alert("Enter valid amount");
return;

}



const {error}=await supabase
.from("job_expenses")
.insert({

job_id:id,

type:etype,

description:edesc,

amount:Number(eamount)

});



if(error){

alert(error.message);
return;

}





const totalExpenses =
expenses.reduce(
(sum,e)=>sum+Number(e.amount || 0),
0
)
+
Number(eamount);




await supabase
.from("jobs")
.update({

profit:
Number(job.total_price || 0)
-
totalExpenses

})
.eq("id",id);




setEtype("");
setEdesc("");
setEamount("");


load();


}







async function deleteExpense(expenseId:string){


if(!confirm("Delete expense?"))
return;



const {error}=await supabase
.from("job_expenses")
.delete()
.eq("id",expenseId);



if(error){

alert(error.message);
return;

}


load();

}







async function addPayment(){


if(Number(pamount)<=0){

alert("Enter valid amount");
return;

}



const {error}=await supabase
.from("payments")
.insert({

job_id:id,

amount:Number(pamount),

payment_type:"deposit",

deposit_mode:"amount",

deposit_value:Number(pamount),

method:pmethod,

status:"paid",

paid_at:new Date().toISOString()

});



if(error){

alert(error.message);
return;

}



setPamount("");

load();


}






async function deletePayment(paymentId:string){


if(!confirm("Delete payment?"))
return;



const {error}=await supabase
.from("payments")
.delete()
.eq("id",paymentId);



if(error){

alert(error.message);
return;

}


load();


}






async function addWorker(){


if(!workerId){

alert("Select worker");
return;

}



const {error}=await supabase
.from("job_workers")
.insert({

job_id:id,

worker_id:workerId

});



if(error){

alert(error.message);
return;

}


setWorkerId("");

load();


}






async function deleteWorker(jobWorkerId:string){


if(!confirm("Remove worker?"))
return;



const {error}=await supabase
.from("job_workers")
.delete()
.eq("id",jobWorkerId);



if(error){

alert(error.message);
return;

}


load();


}
async function markCommissionPaid(){

const {error}=await supabase
.from("jobs")
.update({

salesman_commission_paid:true,

salesman_commission_paid_at:
new Date().toISOString()

})
.eq("id",id);



if(error){

alert(error.message);
return;

}


setCommissionPaid(true);

load();

}






async function uploadPhoto(){


if(!photoFile){

alert("Select photo");
return;

}


setUploading(true);



const fileName =
`${id}-${Date.now()}-${photoFile.name}`;



const {error:uploadError}=await supabase.storage
.from("job-photos")
.upload(fileName,photoFile);



if(uploadError){

alert(uploadError.message);
setUploading(false);
return;

}





const {data}=supabase.storage
.from("job-photos")
.getPublicUrl(fileName);




const {error}=await supabase
.from("job_photos")
.insert({

job_id:id,

url:data.publicUrl

});



if(error){

alert(error.message);
setUploading(false);
return;

}



setPhotoFile(null);

setUploading(false);

load();


}







async function deletePhoto(photoId:string,url:string){


if(!confirm("Delete photo?"))
return;




const {error}=await supabase
.from("job_photos")
.delete()
.eq("id",photoId);



if(error){

alert(error.message);
return;

}





const fileName=url.split("/").pop();



if(fileName){

await supabase.storage
.from("job-photos")
.remove([
fileName
]);

}



load();


}






if(!job){

return <div>Loading...</div>;

}






const expenseTotal =
expenses.reduce(
(sum,e)=>sum+Number(e.amount || 0),
0
);




const paid =
payments.reduce(
(sum,p)=>sum+Number(p.amount || 0),
0
);




const profit =
Number(job.total_price || 0)
-
expenseTotal;




const commission =
profit *
Number(job.salesmen?.commission_percent || 0)
/100;





const card={

background:"#fff",

padding:25,

borderRadius:15,

marginTop:20

};




const table={

width:"100%",

borderCollapse:"collapse" as const

};

const buttonStyle={

background:"#D4AF37",
color:"#111827",
border:"none",
padding:"10px 18px",
borderRadius:8,
fontWeight:700,
cursor:"pointer",
marginLeft:10

};


const deleteButtonStyle={

background:"#DC2626",
color:"#fff",
border:"none",
padding:"8px 14px",
borderRadius:8,
fontWeight:700,
cursor:"pointer"

};



return (

<div

style={{

padding:30,

background:"#f8fafc",

minHeight:"100vh"

}}

>




<h1

style={{

fontSize:32,

fontWeight:800

}}

>

Job Detail

</h1>






<div style={card}>


<h2>
Client Information
</h2>



<table style={table}>


<tbody>


<tr>

<td><b>Name</b></td>

<td>
{job.clients?.name || "-"}
</td>

</tr>



<tr>

<td><b>Phone</b></td>

<td>
{job.clients?.phone || "-"}
</td>

</tr>



<tr>

<td><b>Email</b></td>

<td>
{job.clients?.email || "-"}
</td>

</tr>




<tr>

<td><b>Address</b></td>

<td>
{job.clients?.address || "-"}
</td>

</tr>




<tr>

<td><b>ZIP</b></td>

<td>
{job.clients?.zip_code || "-"}
</td>

</tr>


</tbody>


</table>


</div>







<div style={card}>


<h2>
Salesman
</h2>



<table style={table}>


<tbody>


<tr>

<td>Name</td>

<td>
{job.salesmen?.name || "-"}
</td>


</tr>




<tr>

<td>
Commission
</td>


<td>
{job.salesmen?.commission_percent || 0}%
</td>


</tr>



</tbody>


</table>


</div>







<div style={card}>


<h2>
Status
</h2>



<select

value={job.status}

disabled={
profile?.role==="salesman" ||
profile?.role==="secretary"
}

onChange={(e)=>updateStatus(e.target.value)}

style={{

padding:10,

borderRadius:8

}}

>


<option value="new">
New
</option>


<option value="inspection">
Inspection
</option>


<option value="estimate_sent">
Estimate Sent
</option>


<option value="approved">
Approved
</option>


<option value="scheduled">
Scheduled
</option>


<option value="in_progress">
In Progress
</option>


<option value="done">
Done
</option>



</select>


</div>







<div style={card}>


<h2>
Financial
</h2>



<table style={table}>


<thead>


<tr

style={{

background:"#111827",

color:"#D4AF37"

}}

>


<th>
Price
</th>


<th>
Expenses
</th>


<th>
Paid
</th>


<th>
Balance
</th>


<th>
Profit
</th>


</tr>


</thead>




<tbody>


<tr>


<td>
${Number(job.total_price || 0).toLocaleString()}
</td>


<td>
${expenseTotal.toLocaleString()}
</td>


<td>
${paid.toLocaleString()}
</td>


<td>
${(Number(job.total_price || 0)-paid).toLocaleString()}
</td>


<td>
${profit.toLocaleString()}
</td>


</tr>


</tbody>


</table>


</div>
{/* EXPENSES */}

<div style={card}>

<h2>
Expenses
</h2>


{
profile?.role==="admin" &&

<div>

<input
placeholder="Type"
value={etype}
onChange={(e)=>setEtype(e.target.value)}
/>


<input
placeholder="Description"
value={edesc}
onChange={(e)=>setEdesc(e.target.value)}
/>


<input
type="number"
placeholder="Amount"
value={eamount}
onChange={(e)=>setEamount(e.target.value)}
/>


<button
onClick={addExpense}
style={buttonStyle}
>
Add Expense
</button>

</div>

}



<table style={table}>

<thead>

<tr>

<th>Type</th>
<th>Description</th>
<th>Amount</th>
<th>Action</th>

</tr>

</thead>



<tbody>


{
expenses.map(e=>(

<tr key={e.id}>


<td>
{e.type}
</td>


<td>
{e.description}
</td>


<td>
${e.amount}
</td>


<td>

{
profile?.role==="admin" &&

<button
onClick={()=>deleteExpense(e.id)}
style={deleteButtonStyle}
>
Delete
</button>

}

</td>


</tr>

))

}


</tbody>


</table>


</div>







{/* PAYMENTS */}

<div style={card}>


<h2>
Payments
</h2>



{
profile?.role==="admin" &&

<div>


<input

type="number"

placeholder="Amount"

value={pamount}

onChange={(e)=>setPamount(e.target.value)}
/>



<select

value={pmethod}

onChange={(e)=>setPmethod(e.target.value)}

>


<option value="cash">
Cash
</option>


<option value="check">
Check
</option>


<option value="card">
Card
</option>


<option value="bank">
Bank
</option>


</select>



<button
onClick={addPayment}
style={buttonStyle}
>
Add Payment
</button>


</div>

}




<table style={table}>


<thead>

<tr>

<th>
Amount
</th>

<th>
Method
</th>

<th>
Status
</th>

<th>
Action
</th>


</tr>

</thead>



<tbody>


{
payments.map(p=>(

<tr key={p.id}>


<td>
${p.amount}
</td>


<td>
{p.method}
</td>


<td>
{p.status}
</td>


<td>


{
profile?.role==="admin" &&

<button
onClick={()=>deletePayment(p.id)}
style={deleteButtonStyle}
>
Delete
</button>

}


</td>


</tr>


))

}


</tbody>


</table>


</div>







{/* PHOTOS */}


<div style={card}>


<h2>
Photos
</h2>



<input

type="file"

accept="image/*"

onChange={(e)=>
setPhotoFile(
e.target.files?.[0] || null
)
}

/>



<button

onClick={uploadPhoto}

disabled={uploading}

style={buttonStyle}

>

{
uploading
?
"Uploading..."
:
"Upload Photo"
}


</button>




<div

style={{

display:"flex",

gap:15,

flexWrap:"wrap",

marginTop:20

}}

>


{

photos.map(photo=>(


<div key={photo.id}>


<img

src={photo.url}

width={200}

style={{

borderRadius:10

}}

/>



{

profile?.role==="admin" &&


<button

onClick={()=>
deletePhoto(photo.id,photo.url)
}

style={deleteButtonStyle}

>

Delete

</button>


}


</div>


))

}


</div>



</div>









{/* WORKERS */}



<div style={card}>


<h2>
Workers
</h2>




<select

value={workerId}

onChange={(e)=>setWorkerId(e.target.value)}

>


<option value="">
Select Worker
</option>


{

workers.map(w=>(

<option

key={w.id}

value={w.id}

>

{w.name}

</option>


))

}


</select>





<button

onClick={addWorker}

style={buttonStyle}

>

Assign Worker

</button>





<table style={table}>


<thead>

<tr>

<th>
Name
</th>

<th>
Phone
</th>

<th>
Role
</th>

<th>
Action
</th>


</tr>

</thead>



<tbody>


{

jobWorkers.map(w=>(


<tr key={w.id}>


<td>
{w.workers?.name}
</td>


<td>
{w.workers?.phone}
</td>


<td>
{w.workers?.role}
</td>



<td>


{

profile?.role==="admin" &&


<button

onClick={()=>deleteWorker(w.id)}

style={deleteButtonStyle}

>

Remove

</button>


}



</td>


</tr>


))


}


</tbody>


</table>



</div>







</div>

)

}