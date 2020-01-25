/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"encoding/json"
	"fmt"
	utils "github.com/cd1/utils-golang"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

// Define the Smart Contract structure
type SmartContract struct {
}

// Define the car structure, with 4 properties.  Structure tags are used by encoding/json library
type Car struct {
	Make   string `json:"make"`
	Model  string `json:"model"`
	Colour string `json:"colour"`
	Owner  string `json:"owner"`
}

type User struct {
	Id           string
	Doctype      string
	Name         string
	Email        string
	PasswordHash string
	Address      string
	Contact      string
	Key          string
	Balance      int
	UserType string
}
type Crop struct {
	Id       string
	CropId   string
	OwnerId  string
	OwnerName string
	CropKind string
	Quantity int
	Price    int
	Doctype  string
}

type Transaction struct{
	Id string
	CropId string
	BuyerId string
	OwnerId string
	CropKind string
	CropAmount int
	Price int
	Doctype string
}

/*
 * The Init method is called when the Smart Contract "fabcar" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract "fabcar"
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "BuyCrops" {
		return s.BuyCrops(APIstub, args)
	} else if function == "queryAllCrops" {
		return s.queryAllCrops(APIstub)
	} else if function == "register" {
		return s.register(APIstub, args)
	} else if function == "login" {
		return s.login(APIstub, args)
	} else if function == "queryByKind" {
		return s.queryByKind(APIstub, args)
	} else if function == "createCrops" {
		return s.createCrops(APIstub, args)
	} else if function == "querySellHistory" {
		return s.querySellHistory(APIstub, args)
	}else if function == "queryBuyHistory" {
		return s.queryBuyHistory(APIstub, args)
	} else if function == "userProfile" {
		return s.userProfile(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) register(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	id := utils.RandomString()
	name := args[0]
	email := args[1]
	passwordHash := args[2]
	key := name + passwordHash
	Address := args[3]
	Contact := args[4]
	Balance := 20000
	userType := args[5]
	// Balance:= strconv.Itoa(balance)

	var user = User{id, "User", name, email, passwordHash, Address, Contact, key, Balance, userType}
	fmt.Println("User created In register function:", user)
	userAsBytes, _ := json.Marshal(user)
	APIstub.PutState(id, userAsBytes)
	fmt.Println("User created In register function:", userAsBytes)
	return shim.Success([]byte(userAsBytes))

}
func getUser(APIstub shim.ChaincodeStubInterface, email string) User {
	userQuery1 := newCouchQueryBuilder().addSelector("Doctype", "User").addSelector("Email", email).getQueryString()
	user, _ := lastQueryValueForQueryString(APIstub, userQuery1)
	var userData User
	_ = json.Unmarshal(user, &userData)
	return userData
}




func getUserById(APIstub shim.ChaincodeStubInterface, Id string) User {
	userQuery1 := newCouchQueryBuilder().addSelector("Doctype", "User").addSelector("Id", Id).getQueryString()
	user, _ := lastQueryValueForQueryString(APIstub, userQuery1)
	var userData1 User
	_ = json.Unmarshal(user, &userData1)
	return userData1
}
func getCrop(APIstub shim.ChaincodeStubInterface, Id string) Crop {
	cropQuery1 := newCouchQueryBuilder().addSelector("Doctype", "Crop").addSelector("Id", Id).getQueryString()
	crop, _ := lastQueryValueForQueryString(APIstub, cropQuery1)
	var cropData Crop
	_ = json.Unmarshal(crop, &cropData)
	return cropData
}

func (s *SmartContract) login(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments, required 2, given " + strconv.Itoa(len(args)))
	}
	email := args[0]
	passwordHash := args[1]

	var user User = getUser(APIstub, email)
	if user.PasswordHash != passwordHash {
		return shim.Error("password doesnt match")
	}
	fmt.Println("user found:", user)
	userAsBytes, _ := json.Marshal(user)
	return shim.Success([]byte(userAsBytes))
}

func (s *SmartContract) queryByKind(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	cropKind := args[0]
	queryString := fmt.Sprintf("{\"selector\":{\"DocType\":\"Crop\",\"CropKind\": \"%s\"}}", cropKind)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)

}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	cars := []Car{
		Car{Make: "Toyota", Model: "Prius", Colour: "blue", Owner: "Tomoko"},
	}

	i := 0
	for i < len(cars) {
		fmt.Println("i is ", i)
		carAsBytes, _ := json.Marshal(cars[i])
		APIstub.PutState("CAR"+strconv.Itoa(i), carAsBytes)
		fmt.Println("Added", cars[i])
		i = i + 1
	}

	return shim.Success(nil)
}

func (s *SmartContract) createCrops(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	var cropId string = utils.RandomString()
	var id = cropId
	var ownerid string = args[0]
	var ownername string = args[1]
	var cropKind string = args[2]
	quantity, err := strconv.Atoi(args[3])
	if err != nil {
		fmt.Println("quantity must be an integer :/")
	}
	price, err := strconv.Atoi(args[4])
	if err != nil {
		fmt.Println("Price must be an integer :/")
	}

	var docType string = "Crop"
	var crop = Crop{id, cropId, ownerid, ownername, cropKind, quantity, price, docType}
	cropAsBytes, err := json.Marshal(crop)

	if err!=nil{
		return shim.Error(err.Error())
	}

	err = APIstub.PutState(id, cropAsBytes)
	if err!=nil{
		return shim.Error(err.Error())
	}


	return shim.Success(nil)
}

func (s *SmartContract) queryAllCrops(APIstub shim.ChaincodeStubInterface) sc.Response {

	queryString := "{\"selector\":{\"Doctype\":\"Crop\"}}"
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	fmt.Println("queralllcrops working")
	return shim.Success(queryResults)

}
func (s *SmartContract) querySellHistory(APIstub shim.ChaincodeStubInterface, args[]string) sc.Response {

	ownerId := args[0]
	//queryString := fmt.Sprintf("{\"selector\":{\"DocType\":\"Transaction\",\"OwnerId\": \"%s\"}}", ownerId)
	queryString := newCouchQueryBuilder().addSelector("Doctype","Transaction").addSelector("OwnerId",ownerId).getQueryString()
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)

}

func (s *SmartContract) queryBuyHistory(APIstub shim.ChaincodeStubInterface, args[]string) sc.Response {

	BuyerId := args[0]
	//queryString := fmt.Sprintf("{\"selector\":{\"DocType\":\"Transaction\",\"BuyerId\": \"%s\"}}", BuyerId)
	queryString := newCouchQueryBuilder().addSelector("Doctype","Transaction").addSelector("BuyerId",BuyerId).getQueryString()
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)

}

func (s *SmartContract) BuyCrops(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}
	cropID := args[0]
	buyerId := args[1]
	quan, err := strconv.Atoi(args[2])
	if err != nil {
		fmt.Println("quantity must be an integer :/")
	}
	cropData := getCrop(APIstub, cropID)
	ownerId := cropData.OwnerId
	ownerData := getUserById(APIstub, ownerId)
	buyerData := getUserById(APIstub, buyerId)
	newPrice := cropData.Price*quan

	if buyerData.Balance >= newPrice {
		buyerData.Balance = buyerData.Balance - newPrice
		ownerData.Balance = ownerData.Balance + newPrice
		cropData.Quantity = cropData.Quantity - quan

		id := utils.RandomString()
		buyerCrop := Crop{id, id, buyerId, cropData.OwnerName, cropData.CropKind, quan, cropData.Price, cropData.Doctype}

		//crop er amount kombe
		cropAsBytes, _ := json.Marshal(cropData)
		APIstub.PutState(cropData.Id, cropAsBytes)
		fmt.Println("after update", cropData)

		// buyer er jnno crop create hbe
		buyerCropAsBytes, _ := json.Marshal(buyerCrop)
		APIstub.PutState(buyerCrop.Id, buyerCropAsBytes)
		fmt.Println("after update", buyerData)

		//buyer er taka koima jabe
		buyerDataAsBytes, _ := json.Marshal(buyerData)
		APIstub.PutState(buyerData.Id, buyerDataAsBytes)

		//seller er tk barbe
		ownererDataAsBytes, _ := json.Marshal(ownerData)
		APIstub.PutState(ownerData.Id, ownererDataAsBytes)


		trans_id := utils.RandomString()
		trasn_history := Transaction{trans_id,cropID, buyerId, ownerId, cropData.CropKind,buyerCrop.Quantity,cropData.Price , "Transaction"}

		transAsBytes,_ :=json.Marshal(trasn_history)
		APIstub.PutState( trans_id,transAsBytes)
		return shim.Success(nil)

	}else {
		return shim.Error("error")
	}



}

func (s *SmartContract) userProfile(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	    user_info,err := APIstub.GetState(args[0])

		if err !=nil{
			return shim.Error("vul hoise")
		}

	return shim.Success(user_info)

}

// func (s *SmartContract) changeCropOwner(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 2 {
// 		return shim.Error("Incorrect number of arguments. Expecting 2")
// 	}

// 	cropAsBytes, _ := APIstub.GetState(args[0])
// 	crop := Crop{}

// 	json.Unmarshal(cropAsBytes, &crop)
// 	crop.Name = args[1]

// 	cropAsBytes, _ = json.Marshal(crop)
// 	APIstub.PutState(args[0], cropAsBytes)

// 	return shim.Success(nil)
// }

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
