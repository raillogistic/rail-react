/** Authorized projections reuse the widget without generated queries or mutation powers. */
import { createRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DynamicModelTable } from "../components/DynamicModelTable";
import type { DynamicModelTableHandle } from "../config/types";
const queries=vi.hoisted(()=>({query:vi.fn(),mutation:vi.fn()}));
vi.mock("@apollo/client",async()=>({...await vi.importActual<typeof import("@apollo/client")>("@apollo/client"),useQuery:queries.query,useMutation:queries.mutation}));
const rows=[{id:"1",reference:"DA-1",stage:"Reçu",secret:"confidentiel"}];
const fields={include:[{accessor:"reference" as const,title:"Référence"},{accessor:"stage" as const,title:"Étape",render:()=>"À examiner"}]};

describe("DynamicModelTable controlled projections",()=>{
  beforeEach(()=>vi.clearAllMocks());
  it("renders explicit columns and explicit actions without generated queries or CRUD",()=>{
    const open=vi.fn();
    render(<DynamicModelTable app="requisitions" model="PurchaseRequest" dataSource={{rows}}
      create={{type:"link",hrefTemplate:"/forbidden"}} baseTable={{fields,columnActions:[{label:"Ouvrir",onClick:open}]}} />);
    expect(within(screen.getByRole("table")).getByRole("columnheader",{name:"Référence"})).toBeInTheDocument();
    expect(screen.queryByText("confidentiel")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("table")).getByRole("button",{name:"Ouvrir"}));
    expect(open).toHaveBeenCalledWith(expect.objectContaining({row:rows[0]}));
    expect(queries.query).not.toHaveBeenCalled();expect(queries.mutation).not.toHaveBeenCalled();
  });
  it("delegates server pagination, fixes the page size and preserves the supplied toolbar",()=>{
    const onPageChange=vi.fn(),refetch=vi.fn();
    render(<DynamicModelTable app="requisitions" model="ProcurementCase" dataSource={{rows,refetch,pagination:{page:1,pageSize:20,total:41,hasNext:true,onPageChange}}}
      toolbar={<label>Rechercher<input defaultValue="DOS-1"/></label>} baseTable={{fields}} />);
    fireEvent.click(screen.getByRole("button",{name:"Page suivante"}));expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole("combobox")).toBeDisabled();
    fireEvent.click(screen.getByRole("button",{name:"Actualiser le tableau"}));expect(refetch).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Rechercher")).toHaveValue("DOS-1");
    expect(screen.queryByText("xx")).not.toBeInTheDocument();
  });
  it("reuses the mobile field renderers and only the configured action",()=>{
    const {container}=render(<DynamicModelTable app="requisitions" model="PurchaseRequest" dataSource={{rows}} baseTable={{fields,columnActions:[{label:"Examiner",onClick:vi.fn()}]}}/>);
    const mobile=within(container.querySelector(".md\\:hidden") as HTMLElement);
    expect(mobile.getByText("DA-1")).toBeInTheDocument();expect(mobile.getByText("À examiner")).toBeInTheDocument();
    expect(mobile.getByRole("button",{name:"Examiner"})).toBeInTheDocument();
  });
  it.each(["loading","error","empty"])("renders a recoverable %s state",mode=>{
    const refetch=vi.fn();
    render(<DynamicModelTable app="requisitions" model="PurchaseRequest" dataSource={{rows:[],loading:mode==="loading",error:mode==="error"?new Error("Réseau indisponible"):null,refetch}} baseTable={{fields}}/>);
    if(mode==="error"){expect(screen.getByRole("alert")).toHaveTextContent("Réseau indisponible");fireEvent.click(screen.getByRole("button",{name:"Réessayer"}));expect(refetch).toHaveBeenCalledOnce();}
    else expect(screen.getByRole("status")).toHaveTextContent(mode==="loading"?"Chargement":"Aucun résultat");
  });
  it("updates the imperative snapshot and refresh without retaining old projection data",()=>{
    const ref=createRef<DynamicModelTableHandle<(typeof rows)[number]>>();const refetch=vi.fn();
    const view=render(<DynamicModelTable ref={ref} app="requisitions" model="PurchaseRequest" dataSource={{rows,refetch}} baseTable={{fields}}/>);
    view.rerender(<DynamicModelTable ref={ref} app="requisitions" model="PurchaseRequest" dataSource={{rows:[],refetch}} baseTable={{fields}}/>);
    expect(ref.current?.getSnapshot().data).toEqual([]);expect(ref.current?.metadata).toBeNull();
    void ref.current?.refetch();expect(refetch).toHaveBeenCalledOnce();
  });
});
