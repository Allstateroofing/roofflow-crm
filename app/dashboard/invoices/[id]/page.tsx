"use client";


import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {supabase} from "@/lib/supabaseClient";
import jsPDF from "jspdf";



export default function InvoiceDetail(){


const params=useParams();
const router=useRouter();

const id=params.id as string;



const [invoice,setInvoice]=useState<any>(null);

const [loading,setLoading]=useState(true);





useEffect(()=>{

if(id){

loadInvoice();

}

},[id]);







async function loadInvoice(){


const {data,error}=await supabase
.from("invoices")
.select(`
*,
jobs(
total_price,
clients(
name,
phone,
address
)
)
`)
.eq("id",id)
.single();




if(error){

alert(error.message);

return;

}



setInvoice(data);

setLoading(false);


}









function generatePDF(){


const doc=new jsPDF();



doc.setFontSize(20);

doc.text(
"RoofFlowCRM Invoice",
20,
20
);



doc.setFontSize(12);


doc.text(
`Client: ${invoice.jobs?.clients?.name || "-"}`,
20,
40
);



doc.text(
`Phone: ${invoice.jobs?.clients?.phone || "-"}`,
20,
50
);



doc.text(
`Address: ${invoice.jobs?.clients?.address || "-"}`,
20,
60
);



doc.text(
`Amount: $${invoice.amount}`,
20,
80
);



doc.text(
`Status: ${invoice.status}`,
20,
90
);



doc.text(
`Date: ${new Date(invoice.created_at).toLocaleDateString()}`,
20,
100
);




doc.save(
`invoice-${invoice.id}.pdf`
);


}







if(loading){

return(
<div style={{padding:30}}>
Loading...
</div>
)

}







return(

<div style={{padding:30}}>


<h1>
Invoice
</h1>



<hr/>

<p>
Client:

{invoice.jobs?.clients?.name}

</p>



<p>
Phone:

{invoice.jobs?.clients?.phone}

</p>



<p>
Address:

{invoice.jobs?.clients?.address}

</p>




<h2>
Amount:
$
{Number(invoice.amount).toLocaleString()}
</h2>



<p>
Status:
{invoice.status}
</p>




<button

onClick={generatePDF}

>

Download PDF

</button>





<br/><br/>



<button

onClick={()=>router.push("/dashboard/invoices")}

>

Back

</button>




</div>

)


}