"use client";

import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";


export default function WorkersPage(){


const [workers,setWorkers]=useState<any[]>([]);

const [name,setName]=useState("");
const [phone,setPhone]=useState("");
const [role,setRole]=useState("");



useEffect(()=>{

loadWorkers();

},[]);





async function loadWorkers(){


const {data,error}=await supabase
.from("workers")
.select("*")
.order("created_at",{ascending:false});


if(error){

alert(error.message);
return;

}


setWorkers(data || []);


}





async function addWorker(){


if(!name){

alert("Enter worker name");
return;

}



const {error}=await supabase
.from("workers")
.insert({

name,
phone,
role

});



if(error){

alert(error.message);
return;

}



setName("");
setPhone("");
setRole("");


loadWorkers();


}






async function deleteWorker(id:string){


const ok=confirm(
"Delete worker?"
);


if(!ok)return;



const {error}=await supabase
.from("workers")
.delete()
.eq("id",id);



if(error){

alert(error.message);
return;

}



loadWorkers();


}





return (

<div style={{padding:30}}>


<h1>
Workers
</h1>



<h2>
Add Worker
</h2>



<input

placeholder="Name"

value={name}

onChange={
e=>setName(e.target.value)
}

/>



<br/><br/>



<input

placeholder="Phone"

value={phone}

onChange={
e=>setPhone(e.target.value)
}

/>



<br/><br/>



<input

placeholder="Role"

value={role}

onChange={
e=>setRole(e.target.value)
}

/>



<br/><br/>



<button
onClick={addWorker}
>
Add Worker
</button>





<hr
style={{
marginTop:30
}}
/>





<h2>
Worker List
</h2>




{
workers.map(worker=>(


<div

key={worker.id}

style={{
border:"1px solid #ccc",
padding:15,
marginTop:10,
borderRadius:8
}}

>


<h3>
{worker.name}
</h3>


<p>
Phone: {worker.phone || "-"}
</p>


<p>
Role: {worker.role || "-"}
</p>



<button

onClick={()=>deleteWorker(worker.id)}

>
Delete
</button>



</div>


))

}




</div>

)


}