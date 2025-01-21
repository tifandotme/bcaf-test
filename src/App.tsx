import { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  type GridOptions,
  ModuleRegistry,
  RowSelectionOptions,
} from "ag-grid-community";
import { faker } from "@faker-js/faker";
import {
  AllEnterpriseModule,
  ContextMenuModule,
  LicenseManager,
} from "ag-grid-enterprise";
import { Button } from "./components/ui/button";

// Set your license key here
LicenseManager.setLicenseKey(
  import.meta.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY ?? "",
);

ModuleRegistry.registerModules([
  ContextMenuModule,
  AllCommunityModule,
  AllEnterpriseModule,
]);

type Employee = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  performance: {
    quarterly: {
      q1Score: number;
      q2Score: number;
      q3Score: number;
      q4Score: number;
    };
    projects: {
      completed: number;
      ongoing: number;
      delayed: number;
      qualityScore: number;
    };
    skills: {
      technical: number;
      communication: number;
      leadership: number;
      teamwork: number;
    };
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    leaves: {
      sick: number;
      vacation: number;
      unpaid: number;
    };
  };
  finance: {
    salary: {
      base: number;
      bonus: number;
      overtime: number;
    };
    benefits: {
      insurance: number;
      retirement: number;
      allowance: number;
    };
  };
};

function generateMockData(count: number): Employee[] {
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "Legal",
    "Product",
  ];

  // @ts-expect-error foo
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    department: faker.helpers.shuffle(departments),
    performance: {
      quarterly: {
        q1Score: faker.number.float({ min: 1, max: 5, fractionDigits: 3 }),
        q2Score: faker.number.float({ min: 1, max: 5, fractionDigits: 3 }),
        q3Score: faker.number.float({ min: 1, max: 5, fractionDigits: 3 }),
        q4Score: faker.number.float({ min: 1, max: 5, fractionDigits: 3 }),
      },
      projects: {
        completed: faker.number.int({ min: 0, max: 20 }),
        ongoing: faker.number.int({ min: 0, max: 5 }),
        delayed: faker.number.int({ min: 0, max: 3 }),
        qualityScore: faker.number.float({
          min: 1,
          max: 10,
          fractionDigits: 3,
        }),
      },
      skills: {
        technical: faker.number.float({ min: 1, max: 10, fractionDigits: 3 }),
        communication: faker.number.float({
          min: 1,
          max: 10,
          fractionDigits: 3,
        }),
        leadership: faker.number.float({ min: 1, max: 10, fractionDigits: 3 }),
        teamwork: faker.number.float({ min: 1, max: 10, fractionDigits: 3 }),
      },
    },
    attendance: {
      present: faker.number.int({ min: 200, max: 250 }),
      absent: faker.number.int({ min: 0, max: 15 }),
      late: faker.number.int({ min: 0, max: 20 }),
      leaves: {
        sick: faker.number.int({ min: 0, max: 10 }),
        vacation: faker.number.int({ min: 0, max: 15 }),
        unpaid: faker.number.int({ min: 0, max: 5 }),
      },
    },
    finance: {
      salary: {
        base: faker.number.int({ min: 50000, max: 150000 }),
        bonus: faker.number.int({ min: 0, max: 30000 }),
        overtime: faker.number.int({ min: 0, max: 10000 }),
      },
      benefits: {
        insurance: faker.number.int({ min: 5000, max: 15000 }),
        retirement: faker.number.int({ min: 3000, max: 12000 }),
        allowance: faker.number.int({ min: 2000, max: 8000 }),
      },
    },
  }));
}

function App() {
  const [options, setOptions] = useState({
    pagination: false,
  });

  const gridOptions = useMemo<GridOptions<Employee>>(
    () => ({
      rowData: generateMockData(10000),
      columnDefs: [
        {
          field: "id",
          headerName: "ID",
          pinned: "left",
          width: 100,
        },
        {
          field: "fullName",
          headerName: "Full Name",
          pinned: "left",
          width: 150,
        },
        {
          field: "email",
          headerName: "Email",
          pinned: "left",
          width: 180,
        },
        {
          field: "department",
          headerName: "Department",
          pinned: "left",
          width: 130,
        },
        {
          headerName: "Performance Metrics",
          children: [
            {
              headerName: "Quarterly Evaluation",
              children: [
                {
                  field: "performance.quarterly.q1Score",
                  headerName: "Q1",
                },
                {
                  field: "performance.quarterly.q2Score",
                  headerName: "Q2",
                },
                { field: "performance.quarterly.q3Score", headerName: "Q3" },
                { field: "performance.quarterly.q4Score", headerName: "Q4" },
                {
                  headerName: "Total Score",
                  valueGetter:
                    'getValue("performance.quarterly.q1Score") + getValue("performance.quarterly.q2Score") + getValue("performance.quarterly.q3Score") + getValue("performance.quarterly.q4Score")',
                },
              ],
            },
            {
              headerName: "Project Status",
              children: [
                {
                  field: "performance.projects.completed",
                  headerName: "Completed",
                },
                {
                  field: "performance.projects.ongoing",
                  headerName: "Ongoing",
                },
                {
                  field: "performance.projects.delayed",
                  headerName: "Delayed",
                },
                {
                  field: "performance.projects.qualityScore",
                  headerName: "Quality Score",
                },
              ],
            },
            {
              headerName: "Skill Assessment",
              children: [
                {
                  field: "performance.skills.technical",
                  headerName: "Technical",
                },
                {
                  field: "performance.skills.communication",
                  headerName: "Communication",
                },
                {
                  field: "performance.skills.leadership",
                  headerName: "Leadership",
                },
                {
                  field: "performance.skills.teamwork",
                  headerName: "Teamwork",
                },
              ],
            },
          ],
        },
        {
          headerName: "Attendance Records",
          children: [
            {
              headerName: "General",
              children: [
                { field: "attendance.present", headerName: "Present Days" },
                { field: "attendance.absent", headerName: "Absent Days" },
                { field: "attendance.late", headerName: "Late Arrivals" },
              ],
            },
            {
              headerName: "Leave Details",
              children: [
                { field: "attendance.leaves.sick", headerName: "Sick Leave" },
                { field: "attendance.leaves.vacation", headerName: "Vacation" },
                {
                  field: "attendance.leaves.unpaid",
                  headerName: "Unpaid Leave",
                },
              ],
            },
          ],
        },
        {
          headerName: "Financial Information",
          children: [
            {
              headerName: "Salary Components",
              children: [
                { field: "finance.salary.base", headerName: "Base Salary" },
                { field: "finance.salary.bonus", headerName: "Bonus" },
                { field: "finance.salary.overtime", headerName: "Overtime" },
              ],
            },
            {
              headerName: "Benefits",
              children: [
                {
                  field: "finance.benefits.insurance",
                  headerName: "Insurance",
                },
                {
                  field: "finance.benefits.retirement",
                  headerName: "Retirement",
                },
                {
                  field: "finance.benefits.allowance",
                  headerName: "Allowance",
                },
              ],
            },
          ],
        },
      ],
      defaultColDef: {
        editable: true,
        filter: true,
        enableCellChangeFlash: true,
        onCellValueChanged: (event) => {
          console.log("onCellValueChanged", event);
        },
      },
      enableCellExpressions: true,
      sideBar: {
        hiddenByDefault: true,
      },
      // enableCharts: true,
      // debounceVerticalScrollbar: true,
    }),
    [],
  );

  const rowSelection = useMemo<RowSelectionOptions>(() => {
    return {
      mode: "multiRow",
    };
  }, []);

  useEffect(() => {
    console.log("rowData", gridOptions.rowData);
  }, [gridOptions.rowData]);

  const changeSize = useCallback((value: number) => {
    document.documentElement.style.setProperty("--ag-spacing", `${value}px`);
    document.getElementById("spacing")!.innerText = value.toFixed(1);
  }, []);

  return (
    <div className="grid grid-cols-1 grid-rows-[auto_1fr] gap-1 p-2 h-screen">
      <div className="flex flex-row gap-2 py-2">
        <Button
          size="sm"
          variant={options.pagination ? "default" : "outline"}
          onClick={() => {
            setOptions((prev) => ({
              ...prev,
              pagination: !prev.pagination,
            }));
          }}
        >
          pagination
        </Button>
        <div className="flex flex-row gap-5 items-center">
          spacing ={" "}
          <span className="min-w-[50px]">
            <span id="spacing">8.0</span>px
          </span>
          <input
            type="range"
            // @ts-expect-error correct type
            onInput={(e) => changeSize(e.target.valueAsNumber)}
            defaultValue="8"
            min="0"
            max="20"
            step="0.1"
            style={{ width: "200px" }}
          />
        </div>
      </div>
      <AgGridReact<Employee>
        gridOptions={gridOptions}
        rowSelection={rowSelection}
        // enableCharts
        cellSelection // enterprise
        // undo/redo
        undoRedoCellEditing
        undoRedoCellEditingLimit={20} // default 10
        // pagination
        pagination={options.pagination}
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 30, 40, 50]}
      />
    </div>
  );
}

export default App;
