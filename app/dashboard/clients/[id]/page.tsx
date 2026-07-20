"use client";

import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "@/lib/supabase";


export default function ClientDetail(){

const {id}=useParams();


const [client,setClient]=useState<any>(null);
const [jobs,setJobs]=useState<any[]>([]);
const [payments,setPayments]=useState<any[]>([]);

const [role,setRole]=useState("");

const [edit,setEdit]=useState(false);

const [showPayment,setShowPayment]=useState(false);
const [editPayment,setEditPayment]=useState<any>(null);

const [paymentAmount,setPaymentAmount]=useState("");
const [paymentMethod,setPaymentMethod]=useState("cash");

const [editPaymentAmount,setEditPaymentAmount]=useState("");


const [name,setName]=useState("");
const [phone,setPhone]=useState("");
const [email,setEmail]=useState("");
const [address,setAddress]=useState("");
const [zip,setZip]=useState("");



useEffect(()=>{

load();
loadRole();

},[]);



async function loadRole(){

const {
data:{
user
}
}=await supabase.auth.getUser();


if(!user) return;


const {data,error}=await supabase
.from("profiles")
.select("role")
.eq("id",user.id)
.single();


if(error){
console.log(error);
return;
}


setRole(data.role);

}



async function load(){


const {data:c,error}=await supabase
.from("clients")
.select("*")
.eq("id",id)
.single();


if(error){

alert(error.message);
return;

}


setClient(c);

setName(c.name || "");
setPhone(c.phone || "");
setEmail(c.email || "");
setAddress(c.address || "");
setZip(c.zip_code || "");



const {data:j}=await supabase
.from("jobs")
.select(`
id,
status,
total_price,
scheduled_date,
salesmen(
name
)
`)
.eq("client_id",id)
.order("created_at",{ascending:false});


setJobs(j || []);



const {data:p}=await supabase
.from("payments")
.select("*")
.eq("client_id",id)
.order("created_at",{ascending:false});


setPayments(p || []);

}



async function addPayment(){

if(!paymentAmount) return;


const {error}=await supabase
.from("payments")
.insert({

client_id:id,
amount:Number(paymentAmount),
method:paymentMethod,
status:"paid"

});


if(error){

alert(error.message);
return;

}


setPaymentAmount("");
setPaymentMethod("cash");
setShowPayment(false);

load();

}



async function updatePayment(){


const {error}=await supabase
.from("payments")
.update({

amount:Number(editPaymentAmount)

})
.eq("id",editPayment.id);



if(error){

alert(error.message);
return;

}


setEditPayment(null);
setEditPaymentAmount("");

load();

}




async function saveClient(){


const {error}=await supabase
.from("clients")
.update({

name,
phone,
email,
address,
zip_code:zip

})
.eq("id",id);



if(error){

alert(error.message);
return;

}


setEdit(false);

load();

}




if(!client){

return <div>Loading...</div>

}



const totalPaid =
payments.reduce(
(sum,p)=>sum+Number(p.amount || 0),
0
);



return(

<div
style={{
padding:30,
background:"#f8fafc",
minHeight:"100vh"
}}
>


<h1>
Client Detail
</h1>



<div
style={{
background:"white",
padding:25,
borderRadius:15,
marginBottom:20
}}
>


<h2>
Client Information
</h2>



{
edit ? (

<div>


<div
style={{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:15
}}
>


<input
value={name}
onChange={(e)=>setName(e.target.value)}
placeholder="Name"
/>


<input
value={phone}
onChange={(e)=>setPhone(e.target.value)}
placeholder="Phone"
/>


<input
value={email}
onChange={(e)=>setEmail(e.target.value)}
placeholder="Email"
/>


<input
value={address}
onChange={(e)=>setAddress(e.target.value)}
placeholder="Address"
/>


<input
value={zip}
onChange={(e)=>setZip(e.target.value)}
placeholder="ZIP"
/>


</div>


<br/>


<button
onClick={saveClient}
style={{
background:"#D4AF37",
padding:"10px 20px",
border:0,
borderRadius:8
}}
>
Save Client
</button>


</div>


)

:

(


<div
style={{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:15
}}
>


<div>
<b>Name</b>
<p>{client.name}</p>
</div>


<div>
<b>Phone</b>
<p>{client.phone}</p>
</div>


<div>
<b>Email</b>
<p>{client.email}</p>
</div>


<div>
<b>Address</b>
<p>{client.address}</p>
</div>


<div>
<b>ZIP Code</b>
<p>{client.zip_code}</p>
</div>


</div>


)


}


{
(role==="admin" || role==="secretary") &&

<button
onClick={()=>setEdit(true)}
style={{
marginTop:20,
background:"#D4AF37",
padding:"10px 20px",
border:0,
borderRadius:8
}}
>
Edit Client
</button>

}


</div>
<div
style={{
background:"white",
padding:25,
borderRadius:15,
marginBottom:20
}}
>


<h2>
Jobs
</h2>


{
jobs.map(job=>(

<div
key={job.id}
style={{
borderBottom:"1px solid #ddd",
padding:15
}}
>

<p>Status: {job.status}</p>

<p>
Price: ${Number(job.total_price).toLocaleString()}
</p>

<p>
Salesman: {job.salesmen?.name || "-"}
</p>

<p>
Date: {job.scheduled_date || "-"}
</p>


</div>

))

}


</div>





<div
style={{
background:"white",
padding:25,
borderRadius:15
}}
>


<h2>
Payments
</h2>



<table
style={{
width:"100%",
borderCollapse:"collapse"
}}
>


<thead>

<tr>

<th>Amount</th>

<th>Method</th>

<th>Status</th>

<th>Action</th>

</tr>

</thead>



<tbody>


{
payments.map(p=>(


<tr key={p.id}>


<td>
${Number(p.amount).toLocaleString()}
</td>


<td>
{p.method}
</td>


<td>
{p.status}
</td>


<td>


{
(role==="admin" || role==="secretary") &&

<button
onClick={()=>{

setEditPayment(p);
setEditPaymentAmount(p.amount);

}}

style={{
background:"#D4AF37",
border:0,
padding:"6px 12px",
borderRadius:8
}}
>

Edit

</button>

}


</td>


</tr>


))

}


</tbody>


</table>



<h3>
Total Paid: ${totalPaid.toLocaleString()}
</h3>




{
(role==="admin" || role==="secretary") &&

<button
onClick={()=>setShowPayment(true)}
style={{
background:"#D4AF37",
padding:"10px 20px",
border:0,
borderRadius:8
}}
>

+ Add Payment

</button>

}



</div>






{
showPayment &&

<div
style={{
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,.4)",
display:"flex",
alignItems:"center",
justifyContent:"center"
}}
>


<div
style={{
background:"white",
padding:30,
borderRadius:15
}}
>


<h2>
Add Payment
</h2>


<input
placeholder="Amount"
value={paymentAmount}
onChange={(e)=>setPaymentAmount(e.target.value)}
/>


<br/><br/>


<select
value={paymentMethod}
onChange={(e)=>setPaymentMethod(e.target.value)}
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


<br/><br/>


<button onClick={addPayment}>
Save Payment
</button>


</div>


</div>

}





{
editPayment &&

<div
style={{
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,.4)",
display:"flex",
alignItems:"center",
justifyContent:"center"
}}
>


<div
style={{
background:"white",
padding:30,
borderRadius:15
}}
>


<h2>
Edit Payment
</h2>



<input
value={editPaymentAmount}
onChange={(e)=>setEditPaymentAmount(e.target.value)}
/>


<br/><br/>


<button
onClick={updatePayment}
style={{
background:"#D4AF37",
padding:"10px 20px",
border:0,
borderRadius:8
}}
>

Save Changes

</button>


</div>


</div>

}



</div>

)

}