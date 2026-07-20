"use client";


import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabaseClient";



export default function ReportsPage(){


const [jobs,setJobs]=useState<any[]>([]);

const [expenses,setExpenses]=useState<any[]>([]);

const [payments,setPayments]=useState<any[]>([]);





useEffect(()=>{

loadReports();

},[]);








async function loadReports(){


const {data:jobsData}=await supabase
.from("jobs")
.select(`
*,
clients(
name,
address
),
salesmen(
name
)
`);




const {data:expenseData}=await supabase
.from("job_expenses")
.select("*");





const {data:paymentData}=await supabase
.from("payments")
.select("*");





setJobs(jobsData || []);

setExpenses(expenseData || []);

setPayments(paymentData || []);



}








const totalSales =
jobs.reduce(

(sum,j)=>
sum + Number(j.total_price || 0),

0

);





const totalExpenses =
expenses.reduce(

(sum,e)=>
sum + Number(e.amount || 0),

0

);





const totalPaid =
payments.reduce(

(sum,p)=>
sum + Number(p.amount || 0),

0

);





const profit =
totalSales-totalExpenses;







return(

<div style={{padding:30}}>


<h1>
Reports
</h1>





<hr/>





<h2>
Financial Summary
</h2>



<p>
Total Sales:
$
{totalSales.toLocaleString()}
</p>



<p>
Paid:
$
{totalPaid.toLocaleString()}
</p>




<p>
Expenses:
$
{totalExpenses.toLocaleString()}
</p>




<h2>
Profit:
$
{profit.toLocaleString()}
</h2>







<hr/>





<h2>
Jobs Report
</h2>





{
jobs.map(j=>(


<div

key={j.id}

style={{

border:"1px solid #ddd",

padding:15,

marginTop:10

}}

>


<p>
Client:

{j.clients?.name}

</p>



<p>
Address:

{j.clients?.address}

</p>




<p>
Salesman:

{j.salesmen?.name || "-"}

</p>




<p>
Status:

{j.status}

</p>



<p>
Amount:

$
{Number(j.total_price).toLocaleString()}

</p>



</div>



))

}





</div>


)

}