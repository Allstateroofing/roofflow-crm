"use client";

import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabaseClient";


export default function ZonesPage(){


const [zones,setZones]=useState<any[]>([]);

const [salesmen,setSalesmen]=useState<any[]>([]);


const [name,setName]=useState("");

const [zipCodes,setZipCodes]=useState("");

const [salesmanId,setSalesmanId]=useState("");





useEffect(()=>{

loadZones();

loadSalesmen();

},[]);







async function loadZones(){


const {data,error}=await supabase
.from("zones")
.select(`
*,
salesmen(
name
)
`)
.order("created_at",{ascending:false});


if(error){

alert(error.message);
return;

}


setZones(data || []);


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









async function createZone(){


if(!name || !zipCodes){

alert("Fill zone name and zip codes");

return;

}



const {error}=await supabase
.from("zones")
.insert({

name,

zip_codes:
zipCodes
.split(",")
.map(z=>z.trim()),

salesman_id:
salesmanId || null

});



if(error){

alert(error.message);

return;

}



setName("");

setZipCodes("");

setSalesmanId("");


loadZones();


}








return(

<div style={{padding:30}}>


<h1>
Zones
</h1>




<input

placeholder="Zone Name"

value={name}

onChange={(e)=>setName(e.target.value)}

style={{
display:"block",
marginBottom:10
}}

/>





<input

placeholder="ZIP Codes e.g 07030,07031"

value={zipCodes}

onChange={(e)=>setZipCodes(e.target.value)}

style={{
display:"block",
marginBottom:10
}}

/>







<select

value={salesmanId}

onChange={(e)=>setSalesmanId(e.target.value)}

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






<br/><br/>





<button

onClick={createZone}

>

Create Zone

</button>








<hr/>






{
zones.map(z=>(


<div

key={z.id}

style={{

border:"1px solid #ddd",

padding:15,

marginTop:10

}}

>


<h3>
{z.name}
</h3>



<p>
ZIP:

{z.zip_codes?.join(", ")}

</p>



<p>
Salesman:

{z.salesmen?.name || "Not assigned"}

</p>



</div>


))

}




</div>

)


}