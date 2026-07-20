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

const fileName=
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


// fshi nga tabela
const {error}=await supabase
.from("job_photos")
.delete()
.eq("id",photoId);


if(error){

alert(error.message);
return;

}


// merr emrin e file nga URL
const fileName = url.split("/").pop();


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





return (

<div style={{padding:30}}>


<h1>
Job Detail
</h1>



<h2>Client</h2>

<p>{job.clients?.name || "-"}</p>

<p>{job.clients?.phone || "-"}</p>

<p>{job.clients?.address || "-"}</p>

<p>
ZIP: {job.clients?.zip_code || "-"}
</p>





<h2>Salesman</h2>

<p>
{job.salesmen?.name || "-"}
</p>

<p>
Commission:
{job.salesmen?.commission_percent || 0}%
</p>






<h2>Status</h2>


<select
value={job.status}
disabled={
profile?.role === "salesman" ||
profile?.role === "secretary"
}
onChange={(e)=>updateStatus(e.target.value)}
>

<option value="new">New</option>
<option value="inspection">Inspection</option>
<option value="estimate_sent">Estimate Sent</option>
<option value="approved">Approved</option>
<option value="scheduled">Scheduled</option>
<option value="in_progress">In Progress</option>
<option value="done">Done</option>


</select>







<h2>Financial</h2>


<p>
Price: ${Number(job.total_price).toLocaleString()}
</p>


<p>
Expenses: ${expenseTotal.toLocaleString()}
</p>


<p>
Paid: ${paid.toLocaleString()}
</p>


<p>
Balance:
${(Number(job.total_price)-paid).toLocaleString()}
</p>


<p>
Profit:
${profit.toLocaleString()}
</p>


<p>
Salesman Commission:
${commission.toLocaleString()}
</p>

{
profile?.role === "admin" && (

commissionPaid
?
(
<p
style={{
color:"green",
fontWeight:700
}}
>
✓ Commission Paid
</p>
)
:
(
<button
onClick={markCommissionPaid}
style={{
marginTop:10,
padding:"10px 15px",
background:"#D4AF37",
border:"none",
borderRadius:8,
cursor:"pointer",
fontWeight:700
}}
>
Mark Commission Paid
</button>
)

)
}







{
profile?.role === "admin" && (

<div>

<h2>Add Expense</h2>


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



<button onClick={addExpense}>
Add Expense
</button>


</div>

)
}







<h3>Expenses</h3>


{
expenses.map(e=>(

<div key={e.id}>


{e.type}
-
{e.description}
-
${e.amount}



{
profile?.role === "admin" && (

<button
onClick={()=>deleteExpense(e.id)}
style={{marginLeft:10}}
>
Delete
</button>

)
}


</div>

))

}








{
profile?.role === "admin" && (

<div>

<h2>Add Payment</h2>


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


<button onClick={addPayment}>
Add Payment
</button>


</div>

)
}







<h3>Payments</h3>


{
payments.map(p=>(

<div key={p.id}>


${p.amount}
-
{p.payment_type}
-
{p.method}
-
{p.status}



{
profile?.role === "admin" && (

<button
onClick={()=>deletePayment(p.id)}
style={{marginLeft:10}}
>
Delete
</button>

)
}


</div>

))
}



<hr/>
<hr/>

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

style={{
marginLeft:10
}}

>

{
uploading
?
"Uploading..."
:
"Upload Photo"
}

</button>
<h3>
Job Photos
</h3>


{
photos.map(photo=>(

<div key={photo.id}>


<img

src={photo.url}

width="250"

style={{
marginTop:10,
borderRadius:8
}}

/>

{
profile?.role === "admin" && (

<button
onClick={()=>deletePhoto(photo.id,photo.url)}
>
Delete Photo
</button>

)
}

</div>

))

}
{
profile?.role === "admin" && (

<div>

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

style={{marginLeft:10}}

>
Assign Worker
</button>


</div>

)
}




<h3>
Assigned Workers
</h3>


{
jobWorkers.map(w=>(

<div

key={w.id}

style={{
border:"1px solid #ccc",
padding:10,
marginTop:10
}}

>

<b>
{w.workers?.name}
</b>


<p>
Phone: {w.workers?.phone}
</p>


<p>
Role: {w.workers?.role}
</p>


{
profile?.role === "admin" && (

<button

onClick={()=>deleteWorker(w.id)}

>
Remove
</button>

)
}


</div>

))

}


</div>

)

}