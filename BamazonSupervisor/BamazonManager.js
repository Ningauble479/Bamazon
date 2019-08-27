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
  if (err) {
    console.error("error connecting: " + err.stack);
  }
  loadManagerMenu();
});

function loadManagerMenu() {
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    loadManagerOptions(res);
  });
}

function loadManagerOptions(products) {
  inquirer
    .prompt({
      type: "list",
      name: "choice",
      choices: ["View Stuff", "Not many left stuff?", "Add new stuff????", "Add an entirely new stuff?", "Leave?"],
      message: "WHAT do?"
    })
    .then(function(val) {
      switch (val.choice) {
      case "View Stuff?":
        console.table(products);
        loadManagerMenu();
        break;
      case "Not many left stuff?":
        loadLowInventory();
        break;
      case "Add new stuff????":
        addToInventory(products);
        break;
      case "Add an entirely new stuff?":
        addNewProduct(products);
        break;
      default:
        console.log("Where you go?!");
        process.exit(0);
        break;
      }
    });
}

function loadLowInventory() {
  connection.query("SELECT * FROM products WHERE stock_quantity <= 5", function(err, res) {
    if (err) throw err;
    console.table(res);
    loadManagerMenu();
  });
}

function addToInventory(inventory) {
  console.table(inventory);
  inquirer
    .prompt([
      {
        type: "input",
        name: "choice",
        message: "What id??",
        validate: function(val) {
          return !isNaN(val);
        }
      }
    ])
    .then(function(val) {
      var choiceId = parseInt(val.choice);
      var product = checkInventory(choiceId, inventory);

      if (product) {
        promptManagerForQuantity(product);
      }
      else {
        console.log("\nTheres none!.");
        loadManagerMenu();
      }
    });
}

function promptManagerForQuantity(product) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "quantity",
        message: "How many?",
        validate: function(val) {
          return val > 0;
        }
      }
    ])
    .then(function(val) {
      var quantity = parseInt(val.quantity);
      addQuantity(product, quantity);
    });
}

function addQuantity(product, quantity) {
  connection.query(
    "UPDATE products SET stock_quantity = ? WHERE item_id = ?",
    [product.stock_quantity + quantity, product.item_id],
    function(err, res) {
      console.log("\nSuccessfully added " + quantity + " " + product.product_name + "'s!\n");
      loadManagerMenu();
    }
  );
}


function addNewProduct() {
  getDepartments(function(err, departments) {
    getProductInfo(departments).then(insertNewProduct);
  });
}

function getProductInfo(departments) {
  return inquirer.prompt([
    {
      type: "input",
      name: "product_name",
      message: "What name?"
    },
    {
      type: "list",
      name: "department_name",
      choices: getDepartmentNames(departments),
      message: "Where this?"
    },
    {
      type: "input",
      name: "price",
      message: "What is price?",
      validate: function(val) {
        return val > 0;
      }
    },
    {
      type: "input",
      name: "quantity",
      message: "In stock How many?",
      validate: function(val) {
        return !isNaN(val);
      }
    }
  ]);
}

function insertNewProduct(val) {
  connection.query(
    "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)",
    [val.product_name, val.department_name, val.price, val.quantity],
    function(err, res) {
      if (err) throw err;
      console.log(val.product_name + " ADDED TO BAMAZON!\n");
      loadManagerMenu();
    }
  );
}

function getDepartments(cb) {
  connection.query("SELECT * FROM departments", cb);
}


function getDepartmentNames(departments) {
  return departments.map(function(department) {
    return department.department_name;
  });
}

function checkInventory(choiceId, inventory) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].item_id === choiceId) {
      return inventory[i];
    }
  }
  return null;
}
