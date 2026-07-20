"use client";

import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";


export default function CommissionsPage(){


const [data,setData]=useState<any[]>([]);



useEffect(()=>{

load();

},[]);





async function load(){


const {data:jobs,error}=await supabase
.from("jobs")
.select(`

id,

total_price,

profit,

salesman_commission_paid,

salesman_commission_paid_at,


clients(
name
),


salesmen(
name,
commission_percent
)

`)
.order("created_at",{ascending:false});



if(error){

alert(error.message);
return;

}



const commissions =

(jobs || []).map((job:any)=>{


const commission =

Number(job.profit || 0)

*

Number(
job.salesmen?.commission_percent || 0
)

/100;



return {

id:job.id,

client:
job.clients?.name || "-",


salesman:
job.salesmen?.name || "-",


profit:
Number(job.profit || 0),


commission,


paid:
job.salesman_commission_paid === true


};


});

console.log("COMMISSIONS DATA", commissions);

setData(commissions);


}





async function updateCommissionStatus(
id:string,
status:string
){


const {error}=await supabase
.from("jobs")
.update({

salesman_commission_paid:
status==="paid",


salesman_commission_paid_at:

status==="paid"

?

new Date().toISOString()

:

null


})
.eq("id",id);



if(error){

alert(error.message);
return;

}



load();


}






return(


<div style={{padding:30}}>


<h1>
Salesman Commissions
</h1>



<table

style={{

width:"100%",
borderCollapse:"collapse",
marginTop:30

}}

>


<thead>


<tr>


<th>
Salesman
</th>


<th>
Client
</th>


<th>
Profit
</th>


<th>
Commission
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

data.map((c:any)=>(


<tr key={c.id}>


<td>
{c.salesman}
</td>



<td>
{c.client}
</td>



<td>

${Number(c.profit).toLocaleString()}

</td>



<td>

${Number(c.commission).toLocaleString()}

</td>



<td>

{

c.paid

?

<span style={{
color:"green",
fontWeight:700
}}>
Paid
</span>

:

<span style={{
color:"red",
fontWeight:700
}}>
Unpaid
</span>

}

</td>




<td>


{

!c.paid

?

<button

onClick={()=>updateCommissionStatus(
c.id,
"paid"
)}

>

Mark Paid

</button>


:

<button

onClick={()=>updateCommissionStatus(
c.id,
"unpaid"
)}

>

Undo Paid

</button>


}


</td>



</tr>


))


}



</tbody>



</table>



</div>


)

}