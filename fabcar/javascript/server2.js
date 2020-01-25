var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var sha256 = require('js-sha256');
var session = require('express-session');
var cookie = require('cookie-parser')
// var showToast = require("show-toast");
var app = express();
const FabricCAServices = require('fabric-ca-client');
// const { FileSystemWallet1, } = require('fabric-network');
var fs = require('fs');
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');

const ccpPath = path.resolve(__dirname, '..', '..', 'basic-network', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
const port = 8000;

app.set('views', path.join(__dirname, 'views'));

app.use(cookie());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

//ledger setup ----------------------------------------------
// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

// Check to see if we've already enrolled the user.
const userExists = await wallet.exists('user1');
if (!userExists) {
    console.log('An identity for the user "user1" does not exist in the wallet');
    console.log('Run the registerUser.js application before retrying');
    return;
}

// Create a new gateway for connecting to our peer node.
const gateway = new Gateway();
await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

// Get the network (channel) our contract is deployed to.
const network = await gateway.getNetwork('mychannel');

// Get the contract from the network.
const contract = network.getContract('fabcar');
// end ledger setup ------------------------------------------




app.get('/', function (req, res) {
    var user = req.cookies.user;
    if(user!=null) {
        res.render('index1', { user: user })
    } else {
        res.render('Register');
    }
    
});

app.get('/register', function (req, res) {
    res.render('Register');
});

app.get('/loginn', function (req, res) {
    res.render('Login');
});

app.get('/index', function (req, res) {
    res.render('index1');
});



app.get('/queryAll', function (req, res) {
    res.render('queryAll');
});

app.get('/create', function (req, res) {
    res.render('create');
});
app.get('/queryID', function (req, res) {
    res.render('queryID');
});

app.get('/changeOwner', function (req, res) {
    res.render('changeOwner');
});


app.post('/register', async function (req, res) {
    try {
        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('register', req.body.name, req.body.email, sha256(req.body.password), req.body.Contact_No, req.body.Address);
        console.log('Transaction has been submitted');
        res.render('Login')
        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
});

app.post('/login', async function (req, res) {

    try {

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        console.log(req.body.email, sha256(req.body.password));

        let result = await contract.submitTransaction('login', req.body.email, sha256(req.body.password));
        console.log('Transaction has been submitted');
        let user = JSON.parse(result.toString())
        console.log('user found in login ', user);

        res.cookie("user", JSON.stringify(user) );

        res.redirect("/")

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
});

app.post('/query', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`wallet path is suucessfully found ${wallet}`);


        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('User is not found in waller\n');
            console.log('please use registerUser.js to register user1 before');
            return;
        }
        else {

            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

            const network = await gateway.getNetwork('mychannel');

            const contract = network.getContract('fabcar');

            // const result = await contract.evaluateTransaction('queryAllCars');
            const result1 = await contract.evaluateTransaction('queryAllCrops');

            console.log(JSON.parse(result1.toString()))
            await gateway.disconnect()
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
            console.log('Transaction has been sucessfully evaluated');
            // res.send(x);
        }


    } catch (error) {
        console.log(`Error in evaluating transaction ${error}`);
        process.exit(1);
    }
})

app.post('/CreateCar', async function (req, res) {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('createCrops', req.body.owner, req.body.cropKind, req.body.Quantity, req.body.price);
        console.log('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect()
        res.send("Ok");

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})
app.post('/queryiD', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`wallet path is suucessfully found ${wallet}`);


        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('User is not found in waller\n');
            console.log('please use registerUser.js to register user1');
            return;

        }

        else {
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });
            const network = await gateway.getNetwork('mychannel');
            const contract = network.getContract('fabcar');
            var result = await contract.submitTransaction('queryByKind', req.body.croptype);
            console.log('Query has been sucessfull');
            res.status(200).json({ response: result.toString() });

            await gateway.disconnect();
        }
    }
    catch (error) {
        console.log(`Error in evaluating transaction ${error}`);
        process.exit(1);
    }

});

app.post('/changeOwn', async function (req, res) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }


        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        await contract.submitTransaction('transferOwner', req.body.cropid, req.body.Owner, req.body.Buyer, req.body.quan);
        console.log('Query has been sucessfull');

        // res.end(`Sucessfully owner changed to ${req.body.newOwner}`);
        res.send('ok')
        await gateway.disconnect();

    }
    catch (error) {
        console.log(`Error in evaluating transaction ${error}`);
        process.exit(1);
    }


})
app.post('/enrollAdmin', async function (req, res) {
    try {

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin');
        if (adminExists) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const identity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import('admin', identity);

        // res.send("ok");
        res.render('index');
        // showToast('this is a success toast box');
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }

    //  res.send("Ok");
});

app.post('/User', async function (req, res) {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (userExists) {
            console.log('An identity for the user "user1`" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: 'user1', role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: 'user1', enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import('user1', userIdentity);
        // res.send("OK1");
        res.render('index');
        console.log('Successfully registered and enrolled admin user "user1" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "user1": ${error}`);
        process.exit(1);
    }

    //  res.send("Ok");
});

app.listen(port, function (req, res) {
    console.log(`server running on ${port}......`);
})
