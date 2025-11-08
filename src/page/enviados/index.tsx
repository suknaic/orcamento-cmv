import React from "react";
import { ToastContainer } from "react-toastify";
import { EnviadosProvider, useEnviadosContext } from "./contexts/EnviadosContext";
import { PageHeader } from "./components/PageHeader";
import { SearchAndFilters } from "./components/SearchAndFilters";
import { OrcamentosTable } from "./components/OrcamentosTable";
import { Pagination } from "./components/Pagination";
import { InfoModal } from "./components/InfoModal";
import "react-toastify/ReactToastify.css";

function EnviadosPageContent() {
  return (
    <>
      <ToastContainer position="top-center" autoClose={3500} hideProgressBar={false} theme="dark" />
      <div className="mt-5 max-w-7xl mx-auto p-4 sm:p-6 bg-card rounded-xl shadow-lg border border-border">
        <PageHeader />
        <SearchAndFilters />
        <OrcamentosTable />
        <Pagination />
        <InfoModal />
      </div>
    </>
  );
}

export function OrcamentosEnviadosPage() {
  return (
    <EnviadosProvider>
      <EnviadosPageContent />
    </EnviadosProvider>
  );
}