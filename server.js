const express = require("express");
const { v4 } = require("uuid");
const codes = require("./codes.json");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'view')));

const generate = (val) => {
	const code = v4();
	codes.available[code] = val;

	return code;
};

const setUsed = (id, ref) => {
	const val = codes.available[id];

	codes.used[id] = {
		val,
		ref,
	};

	delete codes.available[id];
};

const isValid = (id) => codes.available[id] || codes.used[id];
const isUsed = (id) => !codes.available[id] && codes.used[id];
const isConfirmed = (id, ref) => codes.used[id] && codes.used[id].ref === ref;

const save = async () =>
	new Promise((resolve, reject) => {
		fs.writeFile("./codes.json", JSON.stringify(codes), "utf8", (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

(async () => {
	app.get("/generate", async (req, res) => {
		try {
			let { value } = req.query;

			value = parseInt(value);

			const code = generate(value);

			await save();

			res.status(200).json({
				code,
				value,
			});
		} catch (err) {
			res.status(400).json({
				err,
			});
		}
	});

	app.get("/setUsed", async (req, res) => {
		try {
			const { id, ref } = req.query;

			setUsed(id, ref);

			await save();

			res.status(200).json({
				id,
				ref,
			});
		} catch (err) {
			res.status(400).json({
				err,
			});
		}
	});
	app.get("/isValid", (req, res) => {
		try {
			const { id } = req.query;

			const valid = isValid(id);

			if (valid) {
				const used = isUsed(id);

				return res.status(200).json({
					valid: true,
					used,
					value: codes.available[id]
				});
			}

			res.status(200).json({
				valid: false,
				value: 0
			});
		} catch (err) {
			res.status(400).json({
				err,
			});
		}
	});
	app.get("/isUsed", (req, res) => {
		try {
			const { id } = req.query;

			const used = isUsed(id);

			if (used) {
				return res.status(200).json({
					used: true,
				});
			}

			res.status(200).json({
				used: false,
			});
		} catch (err) {
			res.status(400).json({
				err,
			});
		}
	});
	app.get("/confirm", (req, res) => {
		try {
			const { id, ref } = req.query;

			const applied = isConfirmed(id, ref);

			if (applied) {
				return res.status(200).json({
					applied,
				});
			}

			res.status(200).json({
				applied,
			});
		} catch (err) {
			res.status(400).json({
				err,
			});
		}
	});
	app.get('/codes', (req, res) => {
		let list = Object.keys(codes.used).map(x =>
			({
				code: x,
				ref: codes.used[x].ref,
				status: 'Used',
				value: codes.used[x].val
			})
		);

		const result = Object.keys(codes.available).map(x =>
			({
				code: x,
				ref: '-',
				status: 'Unused',
				value: codes.available[x]
			})
		).concat(list);
			

		res.status(200).json(result);
	});

	app.get('/admin', (req, res) => {
		res.sendFile(path.join(__dirname, '/view/admin.html'));
	});
	app.get('/seller', (req, res) => {
		res.sendFile(path.join(__dirname, '/view/seller.html'));
	});

	app.listen(8080, () => {
		console.log("Server listening at 8080");
	});
})();
