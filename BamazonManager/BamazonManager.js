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
      choices: ["What sells?", "Little left?", "Add more?", "Add new?", "LEave?"],
      message: "WhaT DO?"
    })
    .then(function(val) {
      switch (val.choice) {
      case "What sells?":
        console.table(products);
        loadManagerMenu();
        break;
      case "Little left?":
        loadLowInventory();
        break;
      case "Add more?":
        addToInventory(products);
        break;
      case "Add new?":
        promptManagerForNewProduct(products);
        break;
      default:
        console.log("Where go?!");
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
        message: "What ID?",
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
        console.log("\nDoes NOT exist?!");
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
        message: "How many new stuff?",
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

function promptManagerForNewProduct(products) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "product_name",
        message: "What it called?"
      },
      {
        type: "list",
        name: "department_name",
        choices: getDepartments(products),
        message: "Where it go?"
      },
      {
        type: "input",
        name: "price",
        message: "How much cost?",
        validate: function(val) {
          return val > 0;
        }
      },
      {
        type: "input",
        name: "quantity",
        message: "How many have?",
        validate: function(val) {
          return !isNaN(val);
        }
      }
    ])
    .then(addNewProduct);
}

function addNewProduct(val) {
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

function getDepartments(products) {
  var departments = [];
  for (var i = 0; i < products.length; i++) {
    if (departments.indexOf(products[i].department_name) === -1) {
      departments.push(products[i].department_name);
    }
  }
  return departments;
}

function checkInventory(choiceId, inventory) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].item_id === choiceId) {
      return inventory[i];
    }
  }
  return null;
}
