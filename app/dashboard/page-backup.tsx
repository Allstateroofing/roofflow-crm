"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [clients, setClients] = useState(0);
  const [estimates, setEstimates] = useState(0);
  const [jobs, setJobs] = useState(0);

  const [revenue, setRevenue] = useState(0);
  const [paid, setPaid] = useState(0);

  const [activeJobs, setActiveJobs] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {

    const { data: clientData } = await supabase
      .from("clients")
      .select("id");

    const { data: estimateData } = await supabase
      .from("estimates")
      .select("total,paid_amount");

    const { data: jobData } = await supabase
      .from("jobs")
      .select("status");


    setClients(clientData?.length || 0);

    setEstimates(estimateData?.length || 0);


    let totalRevenue = 0;
    let totalPaid = 0;


    estimateData?.forEach((e:any)=>{
      totalRevenue += Number(e.total || 0);
      totalPaid += Number(e.paid_amount || 0);
    });


    setRevenue(totalRevenue);
    setPaid(totalPaid);


    setJobs(jobData?.length || 0);


    setActiveJobs(
      jobData?.filter(
        (j:any)=> j.status !== "done"
      ).length || 0
    );


    setCompletedJobs(
      jobData?.filter(
        (j:any)=> j.status === "done"
      ).length || 0
    );

  }


  const remaining = revenue - paid;


  return (

    <div style={{padding:30}}>

      <h1>
        RoofFlowCRM Dashboard
      </h1>


      <div
      style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:20,
        marginTop:25
      }}
      >


        <Card
          title="Total Clients"
          value={clients}
        />


        <Card
          title="Total Estimates"
          value={estimates}
        />


        <Card
          title="Total Jobs"
          value={jobs}
        />


        <Card
          title="Active Jobs"
          value={activeJobs}
        />


        <Card
          title="Completed Jobs"
          value={completedJobs}
        />


        <Card
          title="Revenue"
          value={`$${revenue.toLocaleString()}`}
        />


        <Card
          title="Paid"
          value={`$${paid.toLocaleString()}`}
        />


        <Card
          title="Balance"
          value={`$${remaining.toLocaleString()}`}
        />


      </div>


    </div>

  );
}



function Card(
  {
    title,
    value
  }:{
    title:string;
    value:any;
  }
){

  return (

    <div
    style={{
      border:"1px solid #ddd",
      borderRadius:10,
      padding:20,
    }}
    >

      <h3>{title}</h3>

      <h1>
        {value}
      </h1>

    </div>

  );

}