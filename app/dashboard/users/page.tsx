"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/components/auth/RoleGuard";


export default function UsersPage(){

const [users,setUsers]=useState<any[]>([]);
const [search,setSearch]=useState("");
const [role,setRole]=useState("all");


useEffect(()=>{

loadUsers();

},[]);



async function loadUsers(){

const {data,error}=await supabase
.from("profiles")
.select("*")
.order("full_name");


if(error){

alert(error.message);
return;

}


setUsers(data || []);

}




const filteredUsers = users.filter((user)=>{


const matchName =
user.full_name
?.toLowerCase()
.includes(search.toLowerCase());


const matchRole =
role==="all"
?
true
:
user.role===role;


return matchName && matchRole;


});



async function toggleStatus(id:string,current:boolean){

const {error}=await supabase
.from("profiles")
.update({
active:!current
})
.eq("id",id);


if(error){

alert(error.message);
return;

}


loadUsers();

}





return(

<RoleGuard allowedRoles={["admin"]}>

<div style={{padding:30}}>


<h1>
Users Management
</h1>

<Link href="/dashboard/users/new">
<button>
+ Add User
</button>
</Link>

<div

style={{
display:"flex",
gap:15,
margin:"25px 0"
}}

>


<input

placeholder="Search user..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

style={{
padding:10,
width:250
}}

/>



<select

value={role}

onChange={(e)=>setRole(e.target.value)}

style={{
padding:10
}}

>


<option value="all">
All Roles
</option>


<option value="admin">
Admin
</option>


<option value="secretary">
Secretary
</option>


<option value="manager">
Manager
</option>


<option value="salesman">
Salesman
</option>


<option value="worker">
Worker
</option>


</select>


</div>





<table

style={{
width:"100%",
borderCollapse:"collapse"
}}

>


<thead>

<tr>

<th>Name</th>
<th>Role</th>
<th>Status</th>
<th>Action</th>

</tr>

</thead>



<tbody>


{
filteredUsers.map((user)=>(


<tr key={user.id}>


<td style={{padding:12}}>
{user.full_name || "No Name"}
</td>


<td>
{user.role}
</td>



<td>

{
user.active
?
"Active"
:
"Disabled"
}

</td>



<td>

<Link href={`/dashboard/users/${user.id}`}>

<button>
Edit
</button>

</Link>


<button

onClick={()=>toggleStatus(user.id,user.active)}

style={{
marginLeft:10
}}

>

{
user.active
?
"Disable"
:
"Enable"
}

</button>


</td>


</tr>


))

}


</tbody>


</table>



</div>

</RoleGuard>

)

}