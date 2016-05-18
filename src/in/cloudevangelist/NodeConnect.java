package in.cloudevangelist;

import java.io.BufferedOutputStream;
import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.DatatypeConverter;

@WebServlet("/aspera")
public class NodeConnect extends HttpServlet {

    //Global Variables
    private static final String NODE_SERVER = "demo.asperasoft.com";
    private static final int NODE_SERVER_PORT = 9091;
    private static final String NODE_SERVER_USER = "asperaweb";
    private static final String NODE_SERVER_PASS = "demoaspera";
    private static final String directory = "/";

   /* private static final String NODE_SERVER = "aspera.local";
    private static final int NODE_SERVER_PORT = 9091;
    private static final String NODE_SERVER_USER = "aspera_user_1";
    private static final String NODE_SERVER_PASS = "pwd1";
    private static final String directory = "/";*/

    private static final String allowedConnections = "*"; //When using different Java Port specify CORS support.  Use * for ALL [not recommended]


    //Get POST Data
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        response.addHeader("Access-Control-Allow-Origin", allowedConnections);
        PrintWriter out = response.getWriter();

        //Check for POST Data and return content
        if(request.getParameter("download") != null)
        {
            String spec = "{ \"transfer_requests\" : [ { \"transfer_request\" : { \"paths\" : [ { \"source\" : \"" + request.getParameter("download") + "\" } ] } } ] }";
            try{
                out.print(makeNodeRequest("download_setup", spec));
            } catch(Exception ex){out.print("{\"error\" : \"" + ex + "\"}");}
        }
        else if(request.getParameter("upload") != null)
        {
            String spec = "{ \"transfer_requests\" : [ { \"transfer_request\" : { \"paths\" : [{}], \"destination_root\" : \"" + request.getParameter("upload") + "\" } } ] }";
            try{
                out.print(makeNodeRequest("upload_setup", spec));
            } catch(Exception ex){out.print("{\"error\" : \"" + ex + "\"}");}
        }
        else if(request.getParameter("changeDirectory") != null)
        {
            try{
                out.print(makeNodeRequest("browse", "{ \"path\" : \"" + request.getParameter("changeDirectory") + "\" }"));
            } catch(Exception ex){out.print("{\"error\" : \"" + ex + "\"}");}
        }
        else if(request.getParameter("deleteFile") != null)
        {
            try{
                out.print(makeNodeRequest("delete", "{\"paths\" : [ { \"path\" : \"" + request.getParameter("deleteFile") + "\" }]}"));
            } catch(Exception ex){out.print("{\"error\" : \"" + ex + "\"}");}
        }
        else if(request.getParameter("createDir") != null)
        {
            try{
                out.print(makeNodeRequest("create", "{\"paths\" : [ { \"path\" : \"" + request.getParameter("createDir") + "\", \"type\" : \"directory\" }]}"));
            } catch(Exception ex){out.print("{\"error\" : \"" + ex + "\"}");}
        }
        else if(request.getParameter("startingdirectory") != null)
        {
            out.print(directory);
        }
        else if(request.getParameter("renamePath") != null)
        {
            String[] pathParts = request.getParameter("renamePath").split("/");
            String spec = "{\"paths\" : [{ \"path\" : \"" + request.getParameter("renamePath").replace(pathParts[pathParts.length-1], "") + "\", \"source\" : \"" + pathParts[pathParts.length-1] + "\", \"destination\" : \"" + request.getParameter("renameName") + "\" }]}";
            try{
                out.print(makeNodeRequest("rename", spec));
            } catch(Exception ex){out.print("{\"error\" : \"" + ex + "\"}");}
        }
    }

    public static String makeNodeRequest(String command, String spec) throws IOException
    {
        URL url = new URL("http://" + NODE_SERVER + ":" + NODE_SERVER_PORT + "/files/" + command);
        String authStr = NODE_SERVER_USER + ":" + NODE_SERVER_PASS;
        byte[] valAuthStr = authStr.getBytes();
        //String authEncoded = DatatypeConverter.printBase64Binary(valAuthStr);
        sun.misc.BASE64Encoder encoder = new sun.misc.BASE64Encoder();
        String authEncoded = encoder.encode(valAuthStr);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setDoInput(true);
        connection.setDoOutput(true);
        connection.setRequestProperty("Authorization", "Basic " + authEncoded);
        connection.setRequestProperty("Content-type", "application/x-javascript");
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(connection.getOutputStream()));
        bw.write(spec);
        bw.flush();
        bw.close();
        ByteArrayOutputStream outBytes = new ByteArrayOutputStream();
        InputStream in = connection.getInputStream();
        OutputStream out = new BufferedOutputStream(outBytes);
        for (int b; (b = in.read()) != -1; ) {
            out.write(b);
        }
        out.close();
        in.close();
        return outBytes.toString();
    }
}
