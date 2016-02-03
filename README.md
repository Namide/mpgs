# Mpg

```
VO struct
	

chanMsg:		{from: $UserId, text: $String}
	# Client->Server => chanMsg:		$String
userMsg:		{from: $UserId, to: $UserId, text: $String}		# from disable for Client->Server, to disable fo Server->Client
serverMsg:		$String											# server -> client

userEvt:		{from: $UserId, label: $String, data: $data}	# from facultative for Client->Server
chanEvt:		{label: $String, data: $data}
serverEvt:		{label: $String, data: $data}					# server -> client
	ex: {label: "error", data: {id: $ErrorNum, vars:[]} }
	ex: {label: "chan-added", data: {id: $chanId, name: $chanName} }
	ex: {label: "chan-removed", $chanName }

userData:		$Data											# id required
chanData:		$Data

chanUserList: 	$Array											# server -> client
				[ {role:0, data: {name: "Jean", id: 5}}, {role:1, data: {name: "Nicolas" id: 25, x: 25, y: 65}} ]

serverCmd:		{label: $String, data: $data}					# client -> server

serverChanList: $Array											# server -> client
				// [ "SF", "Linux" ... ]


serverCmd:	(client -> server)
```