"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "@/lib/supabase";


export default function NewEstimatePage(){


const router = useRouter();


const [clients,setClients]=useState<any[]>([]);
const [salesmen,setSalesmen]=useState<any[]>([]);


const [clientId,setClientId]=useState("");
const [salesmanId,setSalesmanId]=useState("");


const [title,setTitle]=useState("");



const [items,setItems]=useState<any[]>([
{
description:"",
quantity:1,
price:0
}
]);



const [depositMode,setDepositMode]=useState("percent");
const [depositValue,setDepositValue]=useState(0);



useEffect(()=>{

loadClients();
loadSalesmen();

},[]);




async function loadClients(){


const {data,error}=await supabase
.from("clients")
.select("*")
.order("name");


if(error){

alert(error.message);
return;

}


setClients(data || []);

}




async function loadSalesmen(){


const {data,error}=await supabase
.from("salesmen")
.select("*")
.order("name");


if(error){

alert(error.message);
return;

}


setSalesmen(data || []);

}





function addItem(){

setItems([
...items,
{
description:"",
quantity:1,
price:0
}
]);

}





function updateItem(
index:number,
field:string,
value:any
){


const copy=[...items];

copy[index][field]=value;

setItems(copy);

}





function removeItem(index:number){


setItems(
items.filter((_,i)=>i!==index)
);


}




const total =
items.reduce(
(sum,item)=>
sum +
(Number(item.quantity)||0) *
(Number(item.price)||0),
0
);




const depositAmount =
depositMode==="percent"
?
total * Number(depositValue)/100
:
Number(depositValue);





async function createEstimate(){


if(!clientId){

alert("Select client");
return;

}
if(!title){

alert("Enter title");
return;

}


if(total<=0){

alert("Add items with price");
return;

}


const {error}=await supabase
.from("estimates")
.insert({

client_id:clientId,

salesman_id:salesmanId || null,

title,

items: items.map(item=>({
description:item.description,
quantity:Number(item.quantity),
price:Number(item.price),
total:
Number(item.quantity) *
Number(item.price)
})),

total,

status:"draft",

deposit_mode:depositMode,

deposit_value:depositValue,

deposit_amount:depositAmount,

paid_amount:0,

remaining_amount:
Number(total)-Number(depositAmount)

});



if(error){

alert(error.message);
return;

}



alert("Estimate created");


router.push(
"/dashboard/estimates"
);


}





return (

<div style={{padding:30}}>


<h1>
Create Estimate
</h1>



<h3>
Client
</h3>


<select

value={clientId}

onChange={(e)=>
setClientId(e.target.value)
}

>


<option value="">
Select Client
</option>


{
clients.map(c=>(

<option
key={c.id}
value={c.id}
>

{c.name}

</option>

))
}


</select>





<h3>
Salesman
</h3>


<select

value={salesmanId}

onChange={(e)=>
setSalesmanId(e.target.value)
}

>


<option value="">
Select Salesman
</option>


{
salesmen.map(s=>(

<option
key={s.id}
value={s.id}
>

{s.name}

</option>

))
}


</select>





<h3>
Title
</h3>


<input

value={title}

onChange={(e)=>
setTitle(e.target.value)
}

placeholder="Roof Replacement"

/>





<hr/>


<h2>
Items
</h2>



{
items.map((item,index)=>(


<div key={index}>


<input

placeholder="Description"

value={item.description}

onChange={(e)=>
updateItem(
index,
"description",
e.target.value
)
}

/>



<input
type="number"
placeholder="Quantity"
value={item.quantity}
onChange={(e)=>
updateItem(
index,
"quantity",
Number(e.target.value)
)
}
/>


<input
type="number"
placeholder="Price"
value={item.price}
onChange={(e)=>
updateItem(
index,
"price",
Number(e.target.value)
)
}
/>



<button

onClick={()=>
removeItem(index)
}

>
Delete
</button>



</div>


))
}




<br/>


<button onClick={addItem}>
+ Add Item
</button>





<hr/>




<h2>
Total:
${total}
</h2>





<h3>
Deposit
</h3>


<select

value={depositMode}

onChange={(e)=>
setDepositMode(e.target.value)
}

>

<option value="percent">
Percent
</option>

<option value="amount">
Amount
</option>


</select>



<input

type="number"

value={depositValue}

onChange={(e)=>
setDepositValue(Number(e.target.value))
}

/>




<h3>
Deposit Amount:
${depositAmount}
</h3>




<h3>
Remaining:
${total-depositAmount}
</h3>




<br/><br/>


<button onClick={createEstimate}>
Create Estimate
</button>




</div>

)


}