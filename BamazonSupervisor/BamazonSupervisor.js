var mysql = require("mysql");
var inquirer = require("inquirer");
require("console.table");


var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Jakeybear5",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connection successful!");
  makeTable();
});

function makeTable() {
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    console.table(res);
    promptSupervisor();
  });
}

function promptSupervisor() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "choice",
        message: "What do?",
        choices: ["How much stuff Sell?", "New Place?", "Leave?"]
      }
    ])
    .then(function(val) {
      if (val.choice === "How much stuff Sell?") {
        viewSales();
      }
      else if (val.choice === "New Place?") {
        addDepartment();
      }
      else {
        console.log("Where go?!");
        process.exit(0);
      }
    });
}

function addDepartment() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "What place called?"
      },
      {
        type: "input",
        name: "overhead",
        message: "How much cost?",
        validate: function(val) {
          return val > 0;
        }
      }
    ])
    .then(function(val) {
      connection.query(
        "INSERT INTO departments (department_name, over_head_costs) VALUES (?, ?)",
        [val.name, val.overhead],
        function(err) {
          if (err) throw err;
          console.log("ADDED DEPARTMENT!");
          makeTable();
        }
      );
    });
}

function viewSales() {
  connection.query(
    " SELECT " +
    "   d.department_id, " +
    "   d.department_name, " +
    "   d.over_head_costs, " +
    "   SUM(IFNULL(p.product_sales, 0)) as product_sales, " +
    "   SUM(IFNULL(p.product_sales, 0)) - d.over_head_costs as total_profit " +
    "FROM products p " +
    "   RIGHT JOIN departments d ON p.department_name = d.department_name " +
    "GROUP BY " +
    "   d.department_id, " +
    "   d.department_name, " +
    "   d.over_head_costs",
    function(err, res) {
      console.table(res);
      promptSupervisor();
    }
  );
}
