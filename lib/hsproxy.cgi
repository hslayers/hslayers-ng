#!/usr/bin/env python

"""This is a blind proxy that we use to get around browser
restrictions that prevent the Javascript from loading pages not on the
same server as the Javascript.  This has several problems: it's less
efficient, it might break some sites, and it's a security risk because
people can use this proxy to browse the web and possibly do bad stuff
with it.  It only loads pages via http and https, but it can load any
content type. It supports GET and POST requests.

.. attribute:: allowedHosts

    list of allowed hosts or None

.. attribute:: encodings

    list of supported encodings for conversion

"""

import requests, urlparse
import cgi, cgitb
import codecs
import sys, os
import re
import logging

reload(sys)
sys.setdefaultencoding('utf-8')
cgitb.enable()

#Proxy config
PROXY = {
#    "http": "http://user:password@10.0.0.1:80",
#    "https": HTTPS
}

#loglevel
LEVEL = logging.DEBUG

# allowedHosts = ['www.openlayers.org', 'openlayers.org']
allowedHosts = None

# list of encodings, which will be used for conversion, when the input is
# not text/xml mimetype
encodings = ["utf-8","windows-1250","iso-8859-2","iso-8859-1","windows-1251"]

def check_for_bom(s):
    bom_info = (
        ('\xc3\xaf\xc2\xbb\xc2\xbf',    3, 'UTF-8'),
        (codecs.BOM_UTF8,    3, 'UTF-8'),
        )
    logging.debug("Start")
    for sig, siglen, enc in bom_info:
        if s.startswith(sig):
            logging.debug("BOM has been found!")
            return s[siglen:]
    logging.debug("BOM check ended!")
    return s

def encode(data,toEncoding,contentType):
    """encode downloaded text to some other requested encoding
    :param data: string object
    :param contentType: content type of the output
    :returns: converted string
    """

    # try for each supported encoding
    for encoding in encodings:
        logging.debug("\n\n\nTrying to convert from %s to %s" % (encoding,toEncoding))
        regx = re.compile(encoding,re.IGNORECASE)
        fromEncoding = re.search(regx,data)
        logging.debug("Looking after %s: %s" % (encoding,fromEncoding))
        try:
            # read the data in given encoding, convert to target encoding
            # replace potential encoding name in the data
            if contentType == "text/xml" and fromEncoding:
                logging.debug("Converting text/xml from %s to %s" % (encoding,toEncoding))
                data = check_for_bom(data)
                sys.stdout = codecs.getwriter(encoding)(sys.stdout)
                return regx.sub(toEncoding,data.decode(encoding).encode(toEncoding))
            elif not contentType == "text/xml":
                logging.debug("Trying to convert %s from %s to %s" % (contentType,encoding,toEncoding))
                sys.stdout = codecs.getwriter(toEncoding)(sys.stdout)
                # do not replace anything, just make the conversion
                return data.decode(encoding).encode(toEncoding)
        except:
            raise

    # nothing was returned and so we end up here, raise error
    logging.warning("Could not convert data to target encoding [%s], tryed one of %s" %\
            (toEncoding,encodings))

    return data

def main():
    """request the data from remote serser, based on POST or GET request
    possibly make the encoding conversion"""

    #Apache has to be set to obtain the environmental variable
    #See README.txt
    if os.environ.get("HTTP_AUTHORIZATION",""):
        authDigest = os.environ.get("HTTP_AUTHORIZATION","")
    else:
        authDigest = None

    method = os.environ["REQUEST_METHOD"]
    try:
        oscookie = os.environ.get("HTTP_COOKIE","")
    except KeyError, e:
        cookie = False

    logging.debug("Cookie: %s" % (oscookie))

    toEncoding = None

    # read the data from POST request
    if method == "POST" or\
            method == "PUT" or \
            method == "DELETE":
        qs = os.environ["QUERY_STRING"]
        d = cgi.parse_qs(qs)
        if d.has_key("url"):
            url = d["url"][0]
        else:
            url = "http://www.hsrs.cz"

	#initialize jsessionid
        if d.has_key("jsessionid"):
            jsessionid = d["jsessionid"][0]
        else:
            jsessionid = None

        if "toEncoding" in d:
            toEncoding = d["toEncoding"][0]

    # read the data from GET request
    elif method == "GET":
        fs = cgi.FieldStorage()
        jsessionid = fs.getvalue('jsessionid')
        logging.debug("Parameter jsessionid : %s" %(jsessionid))
        url = fs.getvalue('url')
        logging.debug("Parameter url : %s" %(url))
        toEncoding = fs.getvalue('toEncoding', None)
    try:
        host = url.split("/")[2]

        if not url.startswith("http"):
            url = "http://%s/%s" % (os.environ["SERVER_NAME"],url)



        if allowedHosts and not host in allowedHosts:
            print "Status: 502 Bad Gateway"
            print "Content-Type: text/plain"
            print
            print "This proxy does not allow you to access that location (%s)." % (host,)
            print
            print os.environ

        elif url.startswith("http://") or url.startswith("https://"):
            session = requests.Session()
            if jsessionid != None:
                #From the GET parameter
                cookie = {'JSESSIONID': jsessionid}
            else:
                #Header cookie format example: JSESSIONID=DKAdNiwe; GUEST_LANGUAGE=en_GB;
                #Requests cookie format {JSESSIONID:DKAdNiwe, GUEST_LANGUAGE:en_GB}
                oscookie = oscookie.split('; ')
                handler = {}

                for c in oscookie:
                    c = c.split('=')
                    if len( c ) > 1:
                        handler[c[0]] = c[1]
                cookie = handler

            #Resends Basic Authentication
            headers = {'Authorization': authDigest}

            req = requests.Request(method, url,cookies=cookie, headers=headers)

            prepped = req.prepare()

            #verify=False doesn't check certificate
            resp = session.send(prepped, proxies=PROXY, verify = False)


            #encoding issue with requests. See http://docs.python-requests.org/en/latest/user/advanced/#encodings
            try:
                if not resp.headers['encoding']:
                    content = resp.text
                else:
                    content = resp.content
            except:
                content = resp.content
            #If the Content type is not specified mostly used text/xml will be used.
            try:
                content_type = resp.headers["content-type"]
            except:
                content_type = "text/xml"
                logging.debug("Empty Content-Type set to text/xml %s" % content_type)
                pass
            # convert any *xml* content type to "text/xml", so that
            # browsers can parse it easy.
            # this applyes especially to something like
            # application/vnd.ogc.wms_xml, produced by UMN MapServer
            if content_type and \
               (content_type.find("xml") > -1 or\
               content_type.find("gml") > -1):
                logging.debug("%s Content-Type set to text/xml" % content_type)
                content_type = "text/xml"
                print "Content-Type: text/xml; charset=%s" % toEncoding
            else:
                logging.debug("Content-Type set to %s" % content_type)
                print "Content-Type: %s; charset=%s" % (content_type,toEncoding)

            # Http has to have one clear line after the Content type clausule
            print

            # convert file encoding
            if toEncoding:
                print encode(content,toEncoding,content_type)
            else:
                print content

            resp.close()
        else:
            print "Content-Type: text/plain"
            print
            print "Illegal request."

    except Exception, E:
        print "Status: 500 Unexpected Error"
        print "Content-Type: text/plain"
        print
        print "Some unexpected error occurred. Error text was:", E

if __name__ == "__main__":
    logging.basicConfig(level=LEVEL)
    main()

