

# Mpg

Lightweight JS websocket server/client.

Client example of chat in the dir [chat](chat/) .


## Roadmap

- 90% Events
- 100% Messages
- 90% Chans
- 70% Roles (user, moderator, admin)
- 95% Chat client
- 0% Game client


## Dependencies


### Server

- NodeJS
- WS


### Client

- jQuery


## Get started

Configure your server with the file `config.json`.
If you don't change it you can test this chat in local.


### On Windows

Open the file `startServer.bat`.

Open the file with your browser `chat/index.html`.


### On Linux

Open your shell, go to the directory `mpgs/` and run the server with the command :

```sh
nodejs index.js

```

Open the file with your browser `chat/index.html`


## Value objects struct
	
```javascript
chanMsg: 		{from: $UserId, text: $String}  
// Client->Server => chanMsg:		$String

userMsg:		{from: $UserId, to: $UserId, text: $String}
// from disable for Client->Server, to disable fo Server->Client

serverMsg:		$String
// server -> client

userEvt:		{from: $UserId, label: $String, data: $data}
// from facultative for Client->Server

chanEvt:		{label: $String, data: $data}

serverEvt:		{label: $String, data: $data}
// server -> client
//	ex: {label: "error", data: {id: $ErrorNum, vars:[]} }
//	ex: {label: "chan-added", data: {id: $chanId, name: $chanName} }
//	ex: {label: "chan-removed", $chanName }

userData:		$data
// id required

chanData:		$data

chanUserList: 	$Array
// server -> client
//	ex: [ {role:0, data: {name: "Jean", id: 5}}, {role:1, data: {name: "Nicolas" id: 25, x: 25, y: 65}} ]

serverCmd:		{label: $String, data: $data}
// client -> server

serverChanList: $Array
// server -> client
//	ex: [ "SF", "Linux" ... ]
```