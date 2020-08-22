var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var sha256 = require("js-sha256");
var session = require("express-session");
var cookie = require("cookie-parser");
// var showToast = require("show-toast");
var app = express();
const FabricCAServices = require("fabric-ca-client");
// const { FileSystemWallet1, } = require('fabric-network');
var fs = require("fs");
const {
    FileSystemWallet,
    Gateway,
    X509WalletMixin,
} = require("fabric-network");

const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "basic-network",
    "connection.json"
);
const ccpJSON = fs.readFileSync(ccpPath, "utf8");
const ccp = JSON.parse(ccpJSON);

const port = 8000;

app.set("views", path.join(__dirname, "views"));
let cookiesOptions = {
    signed: true,
    maxAge: 9999999999999999,
};

app.use(cookie("tapu"));
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
    var user = req.cookies.user;
    if (user != null) {
        res.render("index1", { user: user });
    } else {
        res.render("Register");
    }
});

app.get("/register", function (req, res) {
    res.render("Register");
});

app.get("/login", function (req, res) {
    res.render("Login");
});

app.get("/index", function (req, res) {
    res.render("index1");
});

app.get("/logout", function (req, res) {
    res.clearCookie("tapu");
    res.redirect("/register");
});

app.get("/queryAll", function (req, res) {
    res.render("queryAll");
});

app.get("/create", function (req, res) {
    var user = req.signedCookies.user;
    console.log("user found", user);
    res.render("create", { user: user });
});
// app.get('/queryID', function (req, res) {
//     res.render('queryID');
// });

app.get("/changeOwner", function (req, res) {
    var user = req.signedCookies.user;
    console.log("user found", user);
    res.render("changeOwner", { user: user });
});

app.post("/register", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: "user1",
            discovery: { enabled: false },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction(
            "register",
            req.body.name,
            req.body.email,
            sha256(req.body.password),
            req.body.Contact_No,
            req.body.Address,
            req.body.userType
        );
        console.log("Transaction has been submitted");
        res.redirect("/login");
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
});

app.post("/login", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: "user1",
            discovery: { enabled: false },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        console.log(req.body.email, sha256(req.body.password));

        let result = await contract.submitTransaction(
            "login",
            req.body.email,
            sha256(req.body.password)
        );
        console.log("Transaction has been submitted");
        let user = JSON.parse(result.toString());
        console.log("user found in login ", user);
        res.cookie("user", user, cookiesOptions);
        res.redirect("/index");
        // res.render('index1', { user: user })
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
});

app.post("/query", async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`wallet path is suucessfully found ${wallet}`);

        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log("User is not found in waller\n");
            console.log("please use registerUser.js to register user1 before");
            return;
        } else {
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet,
                identity: "user1",
                discovery: { enabled: false, asLocalhost: true },
            });

            const network = await gateway.getNetwork("mychannel");

            const contract = network.getContract("fabcar");

            // const result = await contract.evaluateTransaction('queryAllCars');
            const result1 = await contract.evaluateTransaction("queryAllCrops");

            console.log(JSON.parse(result1.toString()));
            await gateway.disconnect();
            res.status(200).json({ response: JSON.parse(result1.toString()) });

            // const obj = JSON.parse(result.toString());

            // var x = { rec: [] };
            // for (var i in obj) {

            //     var item = obj[i];
            //     x.rec.push({
            //         "color": item.Record.color,
            //         "key": item.Key
            //     });
            // }
            console.log("Transaction has been sucessfully evaluated");
            // res.send(x);
        }
    } catch (error) {
        console.log(`Error in evaluating transaction ${error}`);
        process.exit(1);
    }
});

app.post("/CreateCar", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: "user1",
            discovery: { enabled: false },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        console.log(
            `Transaction sucessfull\nKey: ${req.body.owner}, Key: ${req.body.cropKind}, Key: ${req.body.Quantity}, Key: ${req.body.price}`
        );
        await contract.submitTransaction(
            "createCrops",
            req.body.owner,
            req.body.ownername,
            req.body.cropKind,
            req.body.Quantity,
            req.body.price
        );
        console.log("Transaction has been submitted");
        // Disconnect from the gateway.
        await gateway.disconnect();
        res.redirect("/create");
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
});
app.get("/SellHistory", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: "user1",
            discovery: { enabled: false },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");
        var user1 = req.signedCookies.user;

        const result1 = await contract.submitTransaction(
            "querySellHistory",
            user1.Id
        );
        console.log("Transaction has been submitted");
        // Disconnect from the gateway.
        await gateway.disconnect();
        return res
            .status(200)
            .json({ response: JSON.parse(result1.toString()) });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
});
app.get("/BuyHistory", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: "user1",
            discovery: { enabled: false },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");
        var user = req.signedCookies.user;

        const result1 = await contract.submitTransaction(
            "queryBuyHistory",
            user.Id
        );
        await gateway.disconnect();
        console.log("Transaction has been submitted");
        return res
            .status(200)
            .json({ response: JSON.parse(result1.toString()) });

        // Disconnect from the gateway.
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
});
app.post("/queryiD", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, {
            wallet,
            identity: "user1",
            discovery: { enabled: false, asLocalhost: true },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");
        var result = await contract.submitTransaction(
            "queryByKind",
            req.body.croptype
        );
        await gateway.disconnect();
        console.log("Query has been sucessfull");
        return res.status(200).json({ response: result.toString() });
    } catch (error) {
        console.log(`Error in evaluating transaction ${error}`);
        process.exit(1);
    }
});

app.post("/changeOwn", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: "user1",
            discovery: { enabled: false },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");

        await contract.submitTransaction(
            "BuyCrops",
            req.body.cropid,
            req.body.Buyer,
            req.body.quan
        );
        console.log("Query has been sucessfull");

        // res.end(`Sucessfully owner changed to ${req.body.newOwner}`);
        res.redirect("/changeOwner");
        await gateway.disconnect();
    } catch (error) {
        console.log(`Error in evaluating transaction ${error}`);
        process.exit(1);
    }
});

app.get("/userProfile", async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists("user1");
        if (!userExists) {
            console.log(
                'An identity for the user "user1" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: "user1",
            discovery: { enabled: false },
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("mychannel");

        // Get the contract from the network.
        const contract = network.getContract("fabcar");
        var user = req.signedCookies.user;

        const result = await contract.submitTransaction("userProfile", user.Id);
        res.status(200).json({ response: result.toString() });
    } catch (error) {
        console.log(`Error in evaluating transaction ${error}`);
        process.exit(1);
    }
});

app.listen(port, function (req, res) {
    console.log(`server running on ${port}......`);
});
