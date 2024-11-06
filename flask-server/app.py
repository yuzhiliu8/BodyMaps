from flask import Flask, send_file, make_response, request, jsonify
from flask_cors import CORS
from handle import processMasks, combine_labels
from constants import main_nifti_filename, BASE_PATH
import secrets
import os
import shutil

app = Flask(__name__)
CORS(app)

def generate_session_key(length=32):
    return secrets.token_hex(length)

@app.route(f'{BASE_PATH}/api', methods=['GET'])
def api():
    return "api home"

@app.route(f'{BASE_PATH}/api/upload', methods= ['POST'])
def upload():
    session_key = generate_session_key(length=32)
    files = request.files
    combine_labels(files, session_key)
    
    # for filename in filenames:
    #     file = files[filename]
    #     file.save(os.path.join(base, 'segmentations', filename))

    return session_key
    

@app.route(f'{BASE_PATH}/api/download/<file>', methods=['POST'])
def download(file):
    sessionKey = request.form['sessionKey']
    if os.path.exists(os.path.join('sessions', sessionKey)):
        isSegmentation = request.form['isSegmentation']
        if isSegmentation:
            path = os.path.join('sessions', sessionKey, 'segmentations', file)
        else:
            path = os.path.join('sessions', sessionKey, file)
        
        response = make_response(send_file(path, mimetype='application/gzip'))
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        response.headers['Content-Encoding'] = 'gzip'

        return response

@app.route(f'{BASE_PATH}/api/mask-data', methods=['POST'])
def get_mask_data():
    session_key = request.form['sessionKey']
    return jsonify(processMasks(session_key))

@app.route(f'{BASE_PATH}/api/terminate-session', methods=['POST'])
def terminate_session():
    session_key = request.form['sessionKey']
    try:
        print(f'removing session: {session_key}')
        shutil.rmtree(os.path.join('sessions', session_key))
        return jsonify({'message': 'removed session!'})
    except:
        return jsonify({'message': 'Session does not exist!'})



if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
